from rest_framework.routers import DefaultRouter
from .views import ia_detection

router = DefaultRouter()
router.register(r'ia_detection', ia_detection, basename='ia_detection')

urlpatterns = router.urls
