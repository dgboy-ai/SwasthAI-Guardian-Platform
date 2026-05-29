import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";

dotenv.config();

const hasAwsCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
const isProduction = process.env.NODE_ENV === 'production';

let docClient = null;

if (hasAwsCredentials || isProduction) {
  try {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: hasAwsCredentials ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      } : undefined
    });
    docClient = DynamoDBDocumentClient.from(client);
    console.log("⚡ AWS DynamoDB Client Initialized.");
  } catch (err) {
    console.error("❌ Failed to initialize AWS DynamoDB Client:", err.message);
  }
}

// In-memory mock storage for fallback development mode
const mockStore = {
  outbreak_telemetry: [],
  sync_queues: [],
  village_node_state: {},
  retry_events: [],
  emergency_streams: []
};

const dynamoHelper = {
  isMock: !docClient,
  
  async put(tableName, item) {
    if (docClient) {
      try {
        await docClient.send(new PutCommand({ TableName: tableName, Item: item }));
        return { success: true };
      } catch (err) {
        console.error(`DynamoDB Put Error on ${tableName}:`, err.message);
        if (!isProduction) {
          console.warn("Falling back to local mock storage.");
          this.putMock(tableName, item);
        }
      }
    } else {
      this.putMock(tableName, item);
    }
  },
  
  putMock(tableName, item) {
    if (!mockStore[tableName]) mockStore[tableName] = [];
    if (tableName === 'village_node_state') {
      mockStore.village_node_state[item.villageId] = item;
    } else {
      mockStore[tableName].push({ ...item, timestamp: item.timestamp || new Date().toISOString() });
    }
    console.log(`[DYNAMODB MOCK PUT] Table: ${tableName}, Item:`, item);
  },

  async query(tableName, keyConditionExpression, expressionAttributeValues) {
    if (docClient) {
      try {
        const res = await docClient.send(new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: keyConditionExpression,
          ExpressionAttributeValues: expressionAttributeValues
        }));
        return res.Items || [];
      } catch (err) {
        console.error(`DynamoDB Query Error on ${tableName}:`, err.message);
        if (!isProduction) return this.queryMock(tableName, expressionAttributeValues);
        return [];
      }
    } else {
      return this.queryMock(tableName, expressionAttributeValues);
    }
  },

  queryMock(tableName, expressionAttributeValues) {
    console.log(`[DYNAMODB MOCK QUERY] Table: ${tableName}`);
    if (tableName === 'village_node_state') {
      return Object.values(mockStore.village_node_state);
    }
    const list = mockStore[tableName] || [];
    const val = expressionAttributeValues ? Object.values(expressionAttributeValues)[0] : null;
    if (val) {
      return list.filter(item => item.villageId === val || item.village_id === val || item.userId === val);
    }
    return list;
  },

  async scan(tableName) {
    if (docClient) {
      try {
        const res = await docClient.send(new ScanCommand({ TableName: tableName }));
        return res.Items || [];
      } catch (err) {
        console.error(`DynamoDB Scan Error on ${tableName}:`, err.message);
        if (!isProduction) return this.scanMock(tableName);
        return [];
      }
    } else {
      return this.scanMock(tableName);
    }
  },

  scanMock(tableName) {
    console.log(`[DYNAMODB MOCK SCAN] Table: ${tableName}`);
    if (tableName === 'village_node_state') {
      return Object.values(mockStore.village_node_state);
    }
    return mockStore[tableName] || [];
  },

  async updateNodeState(villageId, status, lastActive, syncPendingCount) {
    const item = {
      villageId,
      status,
      lastActive: lastActive || new Date().toISOString(),
      syncPendingCount: syncPendingCount || 0
    };
    await this.put('village_node_state', item);
  }
};

export default dynamoHelper;
