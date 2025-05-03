package com.example.essgrading.Activity.Test;

import static android.widget.Toast.LENGTH_SHORT;
import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.hardware.Camera;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.example.essgrading.API.ApiConfig;
import com.example.essgrading.API.ApiService;
import com.example.essgrading.Activity.BaseActivity;
import com.example.essgrading.R;
import com.example.essgrading.Utils.CameraHelper;
import com.example.essgrading.Utils.RetrofitClient;
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

// ... (các import giữ nguyên)

public class GradingMCQActivity extends BaseActivity implements SurfaceHolder.Callback {

    private static final int CAMERA_PERMISSION_REQUEST_CODE = 100;
    private SurfaceView cameraView;
    private SurfaceHolder surfaceHolder;
    private Camera camera;
    private TextView btnStatus, btnDevice;
    private String examId;
    private boolean isCameraProcessing = false;
    private boolean isDeviceProcessing = false;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_gradingmcq);
        setupDrawer();
        setHeaderTitle("Chấm điểm");

        examId = getIntent().getStringExtra("testId");
        cameraView = findViewById(R.id.cameraPreview);
        btnStatus = findViewById(R.id.btnStatus);
        btnDevice = findViewById(R.id.btnDevice);

        surfaceHolder = cameraView.getHolder();
        surfaceHolder.addCallback(this);
        surfaceHolder.setType(SurfaceHolder.SURFACE_TYPE_PUSH_BUFFERS);

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
                == PackageManager.PERMISSION_GRANTED) {
            openCamera();
        } else {
            ActivityCompat.requestPermissions(
                    this, new String[]{Manifest.permission.CAMERA}, CAMERA_PERMISSION_REQUEST_CODE
            );
        }

        btnStatus.setOnClickListener(v -> {
            if (camera != null && !isCameraProcessing && !isDeviceProcessing) {
                isCameraProcessing = true;
                btnStatus.setEnabled(false);
                btnDevice.setEnabled(false);
                camera.takePicture(null, null, pictureCallback);
            }
        });

        btnDevice.setOnClickListener(v -> openGallery());
    }

    private void openGallery() {
        isDeviceProcessing = true;
        btnDevice.setText("Đang xử lý");
        btnDevice.setEnabled(false);
        btnStatus.setEnabled(false);

        Intent intent = new Intent(Intent.ACTION_PICK);
        intent.setType("image/*");
        startActivityForResult(intent, 1);
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
            CameraHelper.initCameraFocus(camera, surfaceHolder, autoFocusHandler);
        } catch (Exception e) {
            btnStatus.setText("Không thể mở camera");
            e.printStackTrace();
        }
    }
    private final Camera.PictureCallback pictureCallback = (data, cam) -> {
        runOnUiThread(() -> btnStatus.setText("📷 Đang xử lý..."));
        new Thread(() -> {
            try {
                Bitmap raw = BitmapFactory.decodeByteArray(data, 0, data.length);
                Matrix matrix = new Matrix();
                matrix.postRotate(90);
                Bitmap bmp = Bitmap.createBitmap(raw, 0, 0, raw.getWidth(), raw.getHeight(), matrix, true);
                sendBitmapToApi(bmp);
            } catch (Exception e) {
                runOnUiThread(() -> handleResult(null, e));
            }
        }).start();
    };

    private void sendBitmapToApi(Bitmap bitmap) {
        isDeviceProcessing = true;
        if (camera != null) camera.stopPreview();
        runOnUiThread(() -> {
            btnStatus.setEnabled(false);
            btnDevice.setEnabled(false);
        });

        new Thread(() -> {
            try {
                ByteArrayOutputStream stream = new ByteArrayOutputStream();
                bitmap.compress(Bitmap.CompressFormat.JPEG, 60, stream);
                byte[] imageBytes = stream.toByteArray();

                RequestBody requestFile = RequestBody.create(MediaType.parse("image/jpeg"), imageBytes);
                MultipartBody.Part filePart = MultipartBody.Part.createFormData("file", "scan.jpg", requestFile);
                RequestBody examIdPart = RequestBody.create(MediaType.parse("text/plain"), String.valueOf(examId));

                ApiService apiService = RetrofitClient.getInstance(this, getString(R.string.upload_url)).create(ApiService.class);
                Call<ResponseBody> call = apiService.uploadMCQ(filePart, examIdPart);

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

    private void handleResult(Response<ResponseBody> response, Throwable error) {
        if (error != null) {
            Toast.makeText(this, "❌ Gửi ảnh thất bại", LENGTH_SHORT).show();
        } else {
            String payload = null;
            try {
                if (response.isSuccessful()) {
                    payload = response.body().string();
                } else if (response.errorBody() != null) {
                    payload = response.errorBody().string();
                }
            } catch (Exception e) {
                e.printStackTrace();
            }

            if (payload != null) {
                try {
                    JSONObject json = new JSONObject(payload);
                    if (json.has("error")) {
                        new AlertDialog.Builder(this)
                                .setTitle("Không thể chấm điểm")
                                .setMessage(json.getString("error"))
                                .setPositiveButton("Đóng", null)
                                .show();
                    } else {
                        String examCode = json.optString("exam_code");
                        int returnedId = json.optInt("exam_id");
                        double score = json.optDouble("score");
                        String studentId = json.optString("student_id");

                        String content = "Mã đề: " + examCode + "\n"
                                + "Exam ID: " + returnedId + "\n"
                                + "Điểm: " + score + "\n"
                                + "SBD: " + studentId;

                        new AlertDialog.Builder(this)
                                .setTitle("Kết quả chấm điểm")
                                .setMessage(content)
                                .setPositiveButton("Đóng", null)
                                .show();
                    }
                } catch (Exception e) {
                    Toast.makeText(this, "❌ Lỗi đọc kết quả", LENGTH_SHORT).show();
                    e.printStackTrace();
                }
            } else {
                int code = response != null ? response.code() : -1;
                Toast.makeText(this, "❌ Lỗi phản hồi: " + code, LENGTH_SHORT).show();
            }
        }

        if (camera == null && surfaceHolder != null && surfaceHolder.getSurface().isValid()) {
            openCamera();
        } else if (camera != null) {
            camera.startPreview();
        }

        btnStatus.setText("📷 Ấn để chụp tiếp");
        btnDevice.setText("Thiết bị");

        btnStatus.setEnabled(true);
        btnDevice.setEnabled(true);

        isCameraProcessing = false;
        isDeviceProcessing = false;
    }

    // ... (openCamera, releaseCamera, onPause, onResume, surface callbacks giữ nguyên)

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == 1 && resultCode == RESULT_OK && data != null) {
            try {
                if (camera != null) camera.stopPreview();
                Uri imageUri = data.getData();
                InputStream inputStream = getContentResolver().openInputStream(imageUri);
                Bitmap bitmap = BitmapFactory.decodeStream(inputStream);
                sendBitmapToApi(bitmap);
            } catch (Exception e) {
                Toast.makeText(this, "❌ Không thể xử lý ảnh", LENGTH_SHORT).show();
                e.printStackTrace();
            }
        } else {
            // Người dùng bấm Back thay vì chọn ảnh
            if (camera == null && surfaceHolder != null && surfaceHolder.getSurface().isValid()) {
                openCamera();
            } else if (camera != null) {
                camera.startPreview();
            }

            btnStatus.setEnabled(true);
            btnDevice.setEnabled(true);
            btnDevice.setText("Thiết bị");

            isCameraProcessing = false;
            isDeviceProcessing = false;
        }
    }

    @Override
    public void surfaceCreated(@NonNull SurfaceHolder holder) {
        openCamera(); // mở camera ngay khi SurfaceHolder sẵn sàng
    }

    @Override
    public void surfaceChanged(@NonNull SurfaceHolder holder, int format, int width, int height) {
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
    public void surfaceDestroyed(@NonNull SurfaceHolder holder) {
        releaseCamera();
    }

    private void releaseCamera() {
        CameraHelper.stopAutoFocusLoop(autoFocusHandler);
        if (camera != null) {
            camera.stopPreview();
            camera.release();
            camera = null;
        }
    }
}

