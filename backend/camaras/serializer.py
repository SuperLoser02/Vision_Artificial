from rest_framework import serializers
from .models import Camara, CamaraDetalles

class CamaraDetallesSerializer(serializers.ModelSerializer):
    stream_url = serializers.SerializerMethodField()

    class Meta:
        model = CamaraDetalles
        fields = '__all__'
        extra_fields = ['stream_url']

    def get_stream_url(self, obj):
        # IP Webcam por defecto
        if obj.marca and 'webcam' in obj.marca.lower():
            return f"http://{obj.ip}:8080/video"
        # RTSP
        if obj.marca and 'rtsp' in obj.marca.lower():
            return f"rtsp://{obj.ip}:554/"
        # Fallback
        return f"http://{obj.ip}:8080/video"

class CamaraSerializer(serializers.ModelSerializer):
    detalles = CamaraDetallesSerializer(many=True, read_only=True)
    class Meta:
        model = Camara
        fields = '__all__'
        depth = 1

class CamaraDetallesSerializer(serializers.ModelSerializer):
    class Meta:
        model = CamaraDetalles
        fields = '__all__'
