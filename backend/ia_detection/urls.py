from rest_framework.routers import DefaultRouter
from .views import ia_detection, DetectionEventViewSet

router = DefaultRouter()
router.register(r'ia_detection', ia_detection, basename='ia_detection')
router.register(r'detection_events', DetectionEventViewSet, basename='detection_events')

urlpatterns = router.urls
