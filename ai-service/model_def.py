import torch
import torch.nn as nn

class SymptomNet(nn.Module):
    def __init__(self, input_dim, num_classes):
        super(SymptomNet, self).__init__()
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
