package com.example.essgrading.Utils;

import android.hardware.Camera;
import android.os.Handler;
import android.view.SurfaceHolder;

public class CameraHelper {
    private static boolean supportContinuousFocus = false;
    private static Runnable autoFocusRunnable;

    /**
     * Setup focus mode:
     * - If CONTINUOUS_PICTURE supported → set and done
     * - Else → run autoFocus loop every 1.5s
     */
    public static void initCameraFocus(Camera camera, SurfaceHolder holder, Handler handler) {
        if (camera == null) return;

        try {
            Camera.Parameters params = camera.getParameters();

            if (params.getSupportedFocusModes().contains(Camera.Parameters.FOCUS_MODE_CONTINUOUS_PICTURE)) {
                params.setFocusMode(Camera.Parameters.FOCUS_MODE_CONTINUOUS_PICTURE);
                supportContinuousFocus = true;
            } else {
                supportContinuousFocus = false;
            }

            camera.setParameters(params);

            if (!supportContinuousFocus) {
                autoFocusRunnable = new Runnable() {
                    @Override
                    public void run() {
                        if (camera != null) {
                            try {
                                camera.autoFocus((success, cam) ->
                                        handler.postDelayed(this, 1500)
                                );
                            } catch (Exception ignored) {}
                        }
                    }
                };
                handler.post(autoFocusRunnable);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * Stop autofocus loop if it was running manually
     */
    public static void stopAutoFocusLoop(Handler handler) {
        if (handler != null && autoFocusRunnable != null) {
            handler.removeCallbacks(autoFocusRunnable);
        }
    }
}
