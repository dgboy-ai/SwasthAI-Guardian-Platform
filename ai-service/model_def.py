import torch
import torch.nn as nn

class SymptomNet(nn.Module):
    def __init__(self, input_dim, num_classes, use_batch_norm=False):
        super(SymptomNet, self).__init__()
        if use_batch_norm:
            self.network = nn.Sequential(
                nn.Linear(input_dim, 128),
                nn.BatchNorm1d(128),
                nn.ReLU(),
                nn.Dropout(0.2),
                nn.Linear(128, 64),
                nn.BatchNorm1d(64),
                nn.ReLU(),
                nn.Dropout(0.1),
                nn.Linear(64, num_classes)
            )
        else:
            self.network = nn.Sequential(
                nn.Linear(input_dim, 128),
                nn.ReLU(),
                nn.Dropout(0.2),
                nn.Linear(128, 64),
                nn.ReLU(),
                nn.Dropout(0.1),
                nn.Linear(64, num_classes)
            )
    
    def forward(self, x):
        return self.network(x)
