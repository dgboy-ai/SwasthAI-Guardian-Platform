import { DynamoDBClient, ListTablesCommand, CreateTableCommand, UpdateTimeToLiveCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";

dotenv.config();

const hasAwsCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
const isProduction = process.env.NODE_ENV === 'production';

let docClient = null;

// ── Table Definitions with Deliberate Access Patterns ─────────────────────────
// Each table has composite keys and GSIs designed for the actual query patterns:
//   outbreak_telemetry : query by village (time-series) + query by disease (cross-village)
//   sync_queues        : query by device (pending items) + query by status (fleet management)
//   village_node_state : single-item lookup by village + TTL auto-expire
//   emergency_streams  : query by district (all emergencies) + query by priority
const TABLE_DEFINITIONS = [
  {
    name: 'outbreak_telemetry',
    // Access pattern A: "All outbreaks in village X after time T" → villageId + detectedAt
    // Access pattern B: "All outbreaks of disease D in last 7 days" → disease-index GSI
    KeySchema: [
      { AttributeName: 'villageId',   KeyType: 'HASH'  },
      { AttributeName: 'detectedAt',  KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'villageId',  AttributeType: 'S' },
      { AttributeName: 'detectedAt', AttributeType: 'S' },
      { AttributeName: 'disease',    AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [{
      IndexName: 'disease-index',
      KeySchema: [
        { AttributeName: 'disease',    KeyType: 'HASH'  },
        { AttributeName: 'detectedAt', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' }
    }],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    name: 'sync_queues',
    // Access pattern A: "All pending items for device D" → deviceId + queuedAt
    // Access pattern B: "All failed syncs across fleet" → status-index GSI
    KeySchema: [
      { AttributeName: 'deviceId',  KeyType: 'HASH'  },
      { AttributeName: 'queuedAt',  KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'deviceId',  AttributeType: 'S' },
      { AttributeName: 'queuedAt',  AttributeType: 'S' },
      { AttributeName: 'status',    AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [{
      IndexName: 'status-index',
      KeySchema: [
        { AttributeName: 'status',   KeyType: 'HASH'  },
        { AttributeName: 'queuedAt', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' }
    }],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    name: 'village_node_state',
    // Access pattern: single-item read/write per village (heartbeat state)
    // TTL: expiresAt — auto-expire stale village nodes after 7 days of inactivity
    KeySchema: [
      { AttributeName: 'villageId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'villageId', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    name: 'emergency_streams',
    // Access pattern A: "All emergencies in district X" → districtId + streamId
    // Access pattern B: "All critical priority events" → priority-index GSI
    KeySchema: [
      { AttributeName: 'districtId', KeyType: 'HASH'  },
      { AttributeName: 'streamId',   KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'districtId', AttributeType: 'S' },
      { AttributeName: 'streamId',   AttributeType: 'S' },
      { AttributeName: 'priority',   AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [{
      IndexName: 'priority-index',
      KeySchema: [
        { AttributeName: 'priority',  KeyType: 'HASH'  },
        { AttributeName: 'streamId',  KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' }
    }],
    BillingMode: 'PAY_PER_REQUEST'
  }
];

async function ensureTablesExist(client) {
  try {
    const listRes = await client.send(new ListTablesCommand({}));
    const existingTables = listRes.TableNames || [];

    for (const tableDef of TABLE_DEFINITIONS) {
      if (!existingTables.includes(tableDef.name)) {
        console.log(`[DynamoDB] Creating table: ${tableDef.name} (composite key + GSI)...`);
        await client.send(new CreateTableCommand({
          TableName:                tableDef.name,
          KeySchema:                tableDef.KeySchema,
          AttributeDefinitions:     tableDef.AttributeDefinitions,
          GlobalSecondaryIndexes:   tableDef.GlobalSecondaryIndexes,
          BillingMode:              tableDef.BillingMode
        }));
        console.log(`[DynamoDB] ✅ Table ${tableDef.name} created.`);

        // Enable TTL on village_node_state
        if (tableDef.name === 'village_node_state') {
          // TTL takes a few seconds to activate after table creation
          setTimeout(async () => {
            try {
              await client.send(new UpdateTimeToLiveCommand({
                TableName: 'village_node_state',
                TimeToLiveSpecification: { AttributeName: 'expiresAt', Enabled: true }
              }));
              console.log('[DynamoDB] ✅ TTL enabled on village_node_state.expiresAt (7-day auto-expire)');
            } catch (ttlErr) {
              console.warn('[DynamoDB] TTL enable skipped:', ttlErr.message);
            }
          }, 5000);
        }
      } else {
        console.log(`[DynamoDB] ✓ Table ${tableDef.name} already exists.`);
      }
    }
  } catch (err) {
    console.warn("[DynamoDB] Table validation/creation error:", err.message);
  }
}

if (hasAwsCredentials || isProduction) {
  try {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || "ap-south-1",  // Default: Mumbai for India
      credentials: hasAwsCredentials ? {
        accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      } : undefined
    });
    docClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: {
        convertEmptyValues: true,
        removeUndefinedValues: true,
      }
    });
    console.log("⚡ AWS DynamoDB Client Initialized (region:", process.env.AWS_REGION || "ap-south-1", ")");
    ensureTablesExist(client);
  } catch (err) {
    console.error("❌ Failed to initialize AWS DynamoDB Client:", err.message);
  }
} else {
  const msg = "[DynamoDB] No AWS credentials — local mock mode. Set AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY for real DynamoDB.";
  if (isProduction) {
    console.error(`⚠️ PRODUCTION WARNING: ${msg}`);
  } else {
    console.log(msg);
  }
}

// ── In-memory mock storage for local dev ─────────────────────────────────────
const mockStore = {
  outbreak_telemetry: [],
  sync_queues:        [],
  village_node_state: {},
  emergency_streams:  []
};

const dynamoHelper = {
  isMock: !docClient,

  // Returns schema info for health/detailed endpoint
  schema: TABLE_DEFINITIONS.map(t => ({
    name:    t.name,
    hashKey: t.KeySchema[0].AttributeName,
    rangeKey: t.KeySchema[1]?.AttributeName || null,
    gsiCount: (t.GlobalSecondaryIndexes || []).length,
    billing: t.BillingMode
  })),

  async put(tableName, item) {
    if (docClient) {
      try {
        await docClient.send(new PutCommand({ TableName: tableName, Item: item }));
        return { success: true, store: 'dynamodb' };
      } catch (err) {
        console.error(`[DynamoDB] Put Error on ${tableName}:`, err.message);
        if (!isProduction) {
          console.warn("[DynamoDB] Falling back to local mock.");
          this._putMock(tableName, item);
        }
        return { success: false, error: err.message };
      }
    } else {
      this._putMock(tableName, item);
      return { success: true, store: 'mock' };
    }
  },

  _putMock(tableName, item) {
    if (!mockStore[tableName]) mockStore[tableName] = [];
    if (tableName === 'village_node_state') {
      mockStore.village_node_state[item.villageId] = item;
    } else {
      mockStore[tableName].push({ ...item, _insertedAt: new Date().toISOString() });
    }
  },

  async get(tableName, key) {
    if (docClient) {
      try {
        const res = await docClient.send(new GetCommand({ TableName: tableName, Key: key }));
        return res.Item || null;
      } catch (err) {
        console.error(`[DynamoDB] Get Error on ${tableName}:`, err.message);
        return null;
      }
    } else {
      if (tableName === 'village_node_state') {
        return mockStore.village_node_state[key.villageId] || null;
      }
      return null;
    }
  },

  async query(tableName, keyConditionExpression, expressionAttributeValues, indexName = null) {
    if (docClient) {
      try {
        const params = {
          TableName:                 tableName,
          KeyConditionExpression:    keyConditionExpression,
          ExpressionAttributeValues: expressionAttributeValues,
        };
        if (indexName) params.IndexName = indexName;
        const res = await docClient.send(new QueryCommand(params));
        return res.Items || [];
      } catch (err) {
        console.error(`[DynamoDB] Query Error on ${tableName}:`, err.message);
        if (!isProduction) return this._queryMock(tableName, expressionAttributeValues);
        return [];
      }
    } else {
      return this._queryMock(tableName, expressionAttributeValues);
    }
  },

  _queryMock(tableName, expressionAttributeValues) {
    if (tableName === 'village_node_state') return Object.values(mockStore.village_node_state);
    const list = mockStore[tableName] || [];
    const val  = expressionAttributeValues ? Object.values(expressionAttributeValues)[0] : null;
    if (val) {
      return list.filter(item =>
        item.villageId === val || item.village_id === val ||
        item.userId === val || item.deviceId === val ||
        item.districtId === val || item.disease === val
      );
    }
    return list;
  },

  async scan(tableName) {
    if (docClient) {
      try {
        const res = await docClient.send(new ScanCommand({ TableName: tableName }));
        return res.Items || [];
      } catch (err) {
        console.error(`[DynamoDB] Scan Error on ${tableName}:`, err.message);
        if (!isProduction) return this._scanMock(tableName);
        return [];
      }
    } else {
      return this._scanMock(tableName);
    }
  },

  _scanMock(tableName) {
    if (tableName === 'village_node_state') return Object.values(mockStore.village_node_state);
    return mockStore[tableName] || [];
  },

  async updateNodeState(villageId, status, lastActive, syncPendingCount) {
    const now = Math.floor(Date.now() / 1000);
    const item = {
      villageId,
      status,
      lastActive:         lastActive || new Date().toISOString(),
      syncPendingCount:   syncPendingCount || 0,
      expiresAt:          now + (7 * 24 * 60 * 60), // TTL: auto-expire after 7 days
    };
    return this.put('village_node_state', item);
  }
};

export default dynamoHelper;
