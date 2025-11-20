from rest_framework import serializers
from .models import Camara, CamaraDetalles
from zonas.serializers import ZonaSerializer


class CamaraDetallesSerializer(serializers.ModelSerializer):
    """
    Serializer para detalles de cámara.
    Incluye zona como FK (nested read, ID write) y stream_url calculado.
    """
    zona_detalle = ZonaSerializer(source='zona', read_only=True)
    stream_url = serializers.SerializerMethodField()

    class Meta:
        model = CamaraDetalles
        fields = '__all__'
        read_only_fields = ['id']

    def get_fields(self):
        fields = super().get_fields()
        fields['stream_url'] = serializers.SerializerMethodField()
        return fields

    def get_stream_url(self, obj):
        """Genera URL de stream según tipo de cámara."""
        # IP Webcam por defecto
        if obj.marca and 'webcam' in obj.marca.lower():
            return f"http://{obj.ip}:8080/video"
        # RTSP
        if obj.marca and 'rtsp' in obj.marca.lower():
            return f"rtsp://{obj.ip}:554/"
        # Fallback
        return f"http://{obj.ip}:8080/video"


class CamaraSerializer(serializers.ModelSerializer):
    """
    Serializer para cámara con detalles anidados.
    """
    detalles = CamaraDetallesSerializer(many=True, read_only=True)
    
    class Meta:
        model = Camara
        fields = '__all__'
        read_only_fields = ['id']

