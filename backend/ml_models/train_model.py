import torch
import torch.nn as nn
from torchvision.models import mobilenet_v3_small

class VideoClassifier(nn.Module):
    def __init__(self, num_classes=3, hidden_size=256, num_lstm_layers=2):
        super(VideoClassifier, self).__init__()
        
        # Feature extractor: MobileNetV3 (sin la capa clasificadora)
        mobilenet = mobilenet_v3_small(pretrained=True)
        self.feature_extractor = nn.Sequential(*list(mobilenet.children())[:-1])
        
        # Congelar primeras capas (fine-tuning)
        for param in list(self.feature_extractor.parameters())[:-20]:
            param.requires_grad = False
        
        # MobileNetV3 small output: 576 features
        feature_size = 576
        
        # LSTM para secuencia temporal
        self.lstm = nn.LSTM(
            input_size=feature_size,
            hidden_size=hidden_size,
            num_layers=num_lstm_layers,
            batch_first=True,
            dropout=0.3,
            bidirectional=True
        )
        
        # Clasificador
        self.classifier = nn.Sequential(
            nn.Linear(hidden_size * 2, 128),  # *2 por bidirectional
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(128, num_classes)
        )
        
    def forward(self, x):
        # x shape: [batch, time, channels, height, width]
        batch_size, time_steps, c, h, w = x.size()
        
        # Extraer features de cada frame
        features = []
        for t in range(time_steps):
            frame = x[:, t, :, :, :]
            feat = self.feature_extractor(frame)
            feat = feat.view(batch_size, -1)
            features.append(feat)
        
        # Stack temporal: [batch, time, features]
        features = torch.stack(features, dim=1)
        
        # LSTM
        lstm_out, _ = self.lstm(features)
        
        # Usar último output del LSTM
        last_output = lstm_out[:, -1, :]
        
        # Clasificación
        output = self.classifier(last_output)
        
        return output