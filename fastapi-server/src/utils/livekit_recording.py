from livekit import api
from src.config.settings import settings
import logging

logger = logging.getLogger(__name__)

class RecordingService:
    def __init__(self):
        self.lkapi = None

    def _get_api(self):
        if not self.lkapi:
            if not settings.livekit_url:
                logger.warning("LiveKit URL not set. Recording disabled.")
                return None
            
            try:
                self.lkapi = api.LiveKitAPI(
                    settings.livekit_url,
                    settings.livekit_api_key,
                    settings.livekit_api_secret,
                )
            except Exception as e:
                logger.error(f"Failed to initialize LiveKit API: {e}")
                return None
        return self.lkapi

    async def start_recording(self, room_name: str, file_name: str) -> str:
        """
        Start a RoomCompositeEgress to record the entire room and save to GCP.
        """
        lk_api = self._get_api()
        if not lk_api:
            logger.warning("LiveKit API not initialized. Skipping recording.")
            return ""

        try:
            # Configure GCP output
            gcp_output = api.EncodedFileOutput(
                 filepath=f"interviews/{file_name}.mp4",
                 gcp=api.GCPUpload(
                     bucket=settings.gcp_bucket_name,
                     credentials_json=settings.google_application_credentials 
                 )
            )

            # Start Egress
            egress = await lk_api.egress.start_room_composite_egress(
                room_name=room_name,
                output=gcp_output,
                preset=api.EncodingOptionsPreset.H264_720P_30,
                layout="single-speaker" # Focus on speaker
            )
            
            logger.info(f"Started egress {egress.egress_id} for room {room_name}")
            return egress.egress_id

        except Exception as e:
            logger.error(f"Failed to start recording: {e}")
            # Don't raise, just log error so we don't crash main flows if recording fails
            return ""

    async def stop_recording(self, egress_id: str):
        if not egress_id:
            return

        lk_api = self._get_api()
        if not lk_api:
            return

        try:
            await lk_api.egress.stop_egress(egress_id)
            logger.info(f"Stopped egress {egress_id}")
        except Exception as e:
            logger.error(f"Failed to stop recording: {e}")
            # Don't raise, just log
            pass

recording_service = RecordingService()
