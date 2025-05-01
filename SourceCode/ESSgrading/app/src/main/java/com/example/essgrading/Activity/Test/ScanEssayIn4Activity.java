package com.example.essgrading.Activity.Test;

import static android.widget.Toast.LENGTH_SHORT;
import android.Manifest;
import android.os.Handler;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.hardware.Camera;
import android.net.Uri;
import android.os.Bundle;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AlertDialog;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.example.essgrading.API.ApiConfig;
import com.example.essgrading.API.ApiService;
import com.example.essgrading.Activity.BaseActivity;
import com.example.essgrading.R;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.concurrent.TimeUnit;
import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.OkHttpClient;
import okhttp3.RequestBody;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;
import com.example.essgrading.Utils.CameraHelper;


public class ScanEssayIn4Activity extends BaseActivity implements SurfaceHolder.Callback {
    private static final int CAMERA_PERMISSION_REQUEST_CODE = 100;
    private SurfaceView cameraView;
    private SurfaceHolder surfaceHolder;
    private Camera camera;
    private TextView btnStatus, btnDevice;
    private boolean isProcessing = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_scanessayin4);
        setupDrawer();
        setHeaderTitle("Quét thông tin");

        cameraView    = findViewById(R.id.cameraPreview);
        btnStatus     = findViewById(R.id.btnStatus);
        btnDevice = findViewById(R.id.btnDevice);

        surfaceHolder = cameraView.getHolder();
        surfaceHolder.addCallback(this);
        surfaceHolder.setType(SurfaceHolder.SURFACE_TYPE_PUSH_BUFFERS);

        // Yêu cầu quyền camera nếu chưa có
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
                == PackageManager.PERMISSION_GRANTED) {
            openCamera();
        } else {
            ActivityCompat.requestPermissions(
                    this,
                    new String[]{Manifest.permission.CAMERA},
                    CAMERA_PERMISSION_REQUEST_CODE
            );
        }

        btnStatus.setOnClickListener(v -> {
            if (camera != null && !isProcessing) {
                isProcessing = true;
                btnStatus.setEnabled(false);
                camera.takePicture(null, null, pictureCallback);
            }
        });

        btnDevice.setOnClickListener(v -> openGallery());
    }

    private void openGallery() {
        Intent galleryIntent = new Intent(Intent.ACTION_PICK);
        galleryIntent.setType("image/*");
        startActivityForResult(galleryIntent, 1);
    }

    private final Camera.PictureCallback pictureCallback = (data, cam) -> {
        // Hiển thị ảnh “freeze” để đóng băng UI
        runOnUiThread(() -> {
            Bitmap raw = BitmapFactory.decodeByteArray(data, 0, data.length);
            Matrix matrix = new Matrix();
            matrix.postRotate(90);
            Bitmap freeze = Bitmap.createBitmap(
                    raw, 0, 0, raw.getWidth(), raw.getHeight(), matrix, true
            );
            btnStatus.setText("📷 Đang xử lý...");
        });

        // Upload ảnh trong background thread
        new Thread(() -> {
            try {
                // Xoay và nén ảnh
                Bitmap raw = BitmapFactory.decodeByteArray(data, 0, data.length);
                Matrix matrix = new Matrix();
                matrix.postRotate(90);
                Bitmap bmp = Bitmap.createBitmap(
                        raw, 0, 0, raw.getWidth(), raw.getHeight(), matrix, true
                );
                ByteArrayOutputStream stream = new ByteArrayOutputStream();
                bmp.compress(Bitmap.CompressFormat.JPEG, 60, stream);
                byte[] imageBytes = stream.toByteArray();

                RequestBody requestFile = RequestBody.create(
                        MediaType.parse("image/jpeg"),
                        imageBytes
                );
                MultipartBody.Part body = MultipartBody.Part.createFormData(
                        "image", "scan.jpg", requestFile
                );

                OkHttpClient client = new OkHttpClient.Builder()
                        .connectTimeout(60, TimeUnit.SECONDS)
                        .readTimeout(60, TimeUnit.SECONDS)
                        .writeTimeout(60, TimeUnit.SECONDS)
                        .build();

                Retrofit retrofit = new Retrofit.Builder()
                        .baseUrl(ApiConfig.UPLOAD_URL)
                        .client(client)
                        .addConverterFactory(GsonConverterFactory.create())
                        .build();

                ApiService service = retrofit.create(ApiService.class);
                Call<ResponseBody> call = service.uploadEssay(body);

                call.enqueue(new Callback<>() {
                    @Override
                    public void onResponse(
                            Call<ResponseBody> call,
                            Response<ResponseBody> response
                    ) {
                        runOnUiThread(() -> handleResult(response, null));
                    }

                    @Override
                    public void onFailure(Call<ResponseBody> call, Throwable t) {
                        runOnUiThread(() -> handleResult(null, t));
                    }
                });

            } catch (Exception e) {
                runOnUiThread(() -> handleResult(null, e));
            }
        }).start();
    };

    private void handleResult(Response<ResponseBody> response, Throwable error) {
        if (error != null) {
            Toast.makeText(this, "❌ Gửi ảnh thất bại", LENGTH_SHORT).show();
            btnStatus.setText("📷Ấn để chụp tiếp");
        }
        else if (response != null && response.isSuccessful() && response.body() != null) {
            try {
                String result = response.body().string();
                JSONObject json = new JSONObject(result);
                JSONArray qrArr = json.getJSONArray("qr_content");
                String qrCode = qrArr.getString(0);
                String score  = json.getString("score");
                String code   = json.getString("student_code");
                btnStatus.setText("📷Ấn để chụp tiếp");
                showResultDialog(qrCode, score, code);
            } catch (Exception e) {
                Toast.makeText(this, "❌ Lỗi đọc kết quả", LENGTH_SHORT).show();
                btnStatus.setText("📷Ấn để chụp tiếp");
                e.printStackTrace();
            }
        }
        else {
            int code = (response != null ? response.code() : -1);
            Toast.makeText(this, "❌ Lỗi phản hồi: " + code, LENGTH_SHORT).show();
            btnStatus.setText("📷Ấn để chụp tiếp");
        }

        // Reset UI & camera preview
        if (camera != null) camera.startPreview();
        btnStatus.setEnabled(true);
        isProcessing = false;
    }

    /** Hiển thị 1 AlertDialog ở giữa màn hình với nút Close **/
    private void showResultDialog(String qr, String score, String code) {
        View dialogView = getLayoutInflater()
                .inflate(R.layout.dialog_scan_result, null);

        TextView tvContent = dialogView.findViewById(R.id.tvResultContent);
        Button btnClose   = dialogView.findViewById(R.id.btnCloseDialog);

        String text = "Mã QR: " + qr + "\n"
                + "Điểm: " + score + "\n"
                + "SBD: " + code;
        tvContent.setText(text);

        AlertDialog dialog = new AlertDialog.Builder(this)
                .setView(dialogView)
                .setCancelable(false)
                .create();

        btnClose.setOnClickListener(v -> dialog.dismiss());
        dialog.show();
    }

    private Handler autoFocusHandler = new Handler();

    private void openCamera() {
        try {
            camera = Camera.open(0);
            camera.setDisplayOrientation(90);
            if (surfaceHolder.getSurface() != null) {
                camera.setPreviewDisplay(surfaceHolder);
                camera.startPreview();
            }

            // ✅ Dùng class tái sử dụng
            CameraHelper.initCameraFocus(camera, surfaceHolder, autoFocusHandler);

        } catch (Exception e) {
            btnStatus.setText("Không thể mở camera");
            e.printStackTrace();
        }
    }

    private void releaseCamera() {
        CameraHelper.stopAutoFocusLoop(autoFocusHandler);
        if (camera != null) {
            camera.stopPreview();
            camera.release();
            camera = null;
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        releaseCamera();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        releaseCamera();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (camera == null && surfaceHolder != null && surfaceHolder.getSurface().isValid()) {
            openCamera();
        }
    }


    @Override
    public void surfaceCreated(SurfaceHolder holder) {
        openCamera();
    }

    @Override
    public void surfaceChanged(
            SurfaceHolder holder, int format, int width, int height
    ) {
        if (camera != null) {
            camera.stopPreview();
            try {
                camera.setPreviewDisplay(holder);
                camera.startPreview();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    @Override
    public void surfaceDestroyed(SurfaceHolder holder) {
        releaseCamera();
    }
    
    private void sendBitmapToApi(Bitmap bitmap) {
        btnStatus.setText("📷 Đang xử lý...");
        btnStatus.setEnabled(false);
        isProcessing = true;

        if (camera != null) {
            camera.stopPreview();
        }

        new Thread(() -> {
            try {
                ByteArrayOutputStream stream = new ByteArrayOutputStream();
                bitmap.compress(Bitmap.CompressFormat.JPEG, 60, stream);
                byte[] imageBytes = stream.toByteArray();

                RequestBody requestFile = RequestBody.create(
                        MediaType.parse("image/jpeg"),
                        imageBytes
                );
                MultipartBody.Part body = MultipartBody.Part.createFormData(
                        "image", "scan.jpg", requestFile
                );

                OkHttpClient client = new OkHttpClient.Builder()
                        .connectTimeout(60, TimeUnit.SECONDS)
                        .readTimeout(60, TimeUnit.SECONDS)
                        .writeTimeout(60, TimeUnit.SECONDS)
                        .build();

                Retrofit retrofit = new Retrofit.Builder()
                        .baseUrl(ApiConfig.UPLOAD_URL)
                        .client(client)
                        .addConverterFactory(GsonConverterFactory.create())
                        .build();

                ApiService service = retrofit.create(ApiService.class);
                Call<ResponseBody> call = service.uploadEssay(body);

                call.enqueue(new Callback<>() {
                    @Override
                    public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                        runOnUiThread(() -> handleResult(response, null));
                    }

                    @Override
                    public void onFailure(Call<ResponseBody> call, Throwable t) {
                        runOnUiThread(() -> handleResult(null, t));
                    }
                });

            } catch (Exception e) {
                runOnUiThread(() -> handleResult(null, e));
            }
        }).start();
    }
}
