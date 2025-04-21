package com.example.essgrading.Activity.Test;

import static android.widget.Toast.LENGTH_SHORT;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.hardware.Camera;
import android.os.Bundle;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.example.essgrading.API.ApiConfig;
import com.example.essgrading.API.ApiService;
import com.example.essgrading.Activity.BaseActivity;
import com.example.essgrading.R;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
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

public class GradingActivity extends BaseActivity implements SurfaceHolder.Callback {

    private static final int CAMERA_PERMISSION_REQUEST_CODE = 100;
    private SurfaceView cameraView;
    private SurfaceHolder surfaceHolder;
    private Camera camera;
    private TextView btnStatus;
    private ImageView snapshotView;
    private boolean isProcessing = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_grading);
        setupDrawer();
        setHeaderTitle("Chấm điểm");

        cameraView = findViewById(R.id.cameraPreview);
        btnStatus = findViewById(R.id.btnStatus);
        snapshotView = findViewById(R.id.snapshotView);

        surfaceHolder = cameraView.getHolder();
        surfaceHolder.addCallback(this);
        surfaceHolder.setType(SurfaceHolder.SURFACE_TYPE_PUSH_BUFFERS);

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            openCamera();
        } else {
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.CAMERA}, CAMERA_PERMISSION_REQUEST_CODE);
        }

        btnStatus.setOnClickListener(v -> {
            if (camera != null && !isProcessing) {
                isProcessing = true;
                btnStatus.setEnabled(false);
                camera.takePicture(null, null, pictureCallback);
            }
        });
    }

    private final Camera.PictureCallback pictureCallback = (data, cam) -> {
        // Rotate and display snapshot for 'freeze' effect
        runOnUiThread(() -> {
            Bitmap raw = BitmapFactory.decodeByteArray(data, 0, data.length);
            Matrix matrix = new Matrix();
            matrix.postRotate(90);
            Bitmap freezeBitmap = Bitmap.createBitmap(raw, 0, 0,
                    raw.getWidth(), raw.getHeight(), matrix, true);
            snapshotView.setImageBitmap(freezeBitmap);
            snapshotView.setVisibility(View.VISIBLE);
            btnStatus.setText("📷 Đang xử lý...");
        });

        // Process upload in background
        new Thread(() -> {
            try {
                ByteArrayOutputStream stream = new ByteArrayOutputStream();
                Bitmap raw = BitmapFactory.decodeByteArray(data, 0, data.length);
                Matrix matrix = new Matrix();
                matrix.postRotate(90);
                Bitmap bitmap = Bitmap.createBitmap(raw, 0, 0,
                        raw.getWidth(), raw.getHeight(), matrix, true);
                bitmap.compress(Bitmap.CompressFormat.JPEG, 60, stream);
                byte[] imageBytes = stream.toByteArray();

                RequestBody requestFile = RequestBody.create(
                        MediaType.parse("image/jpeg"), imageBytes);
                MultipartBody.Part body = MultipartBody.Part.createFormData(
                        "image", "scan.jpg", requestFile);

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
                Call<ResponseBody> call = service.uploadImage(body);

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
    };

    private void handleResult(Response<ResponseBody> response, Throwable error) {
        if (error != null) {
            btnStatus.setText("❌ Gửi ảnh thất bại\n📷Ấn để chụp tiếp");
        } else if (response != null && response.isSuccessful() && response.body() != null) {
            try {
                String result = response.body().string();
                JSONObject json = new JSONObject(result);
                JSONArray qr = json.getJSONArray("qr_content");
                String score = json.getString("score");
                String code = json.getString("student_code");
                Toast.makeText(this, "Thành công", LENGTH_SHORT).show();
                btnStatus.setText("✅ Mã QR: " + qr.getString(0) +
                        "\nĐiểm: " + score + "\nSBD: " + code +
                        "\n📷Ấn để chụp tiếp");
            } catch (Exception e) {
                btnStatus.setText("❌ Lỗi đọc kết quả\n📷Ấn để chụp tiếp");
                e.printStackTrace();
            }
        } else {
            int code = response != null ? response.code() : -1;
            btnStatus.setText("❌ Lỗi phản hồi: " + code + "\n📷Ấn để chụp tiếp");
        }

        // Reset preview and UI
        if (camera != null) {
            camera.startPreview();
        }
        snapshotView.setVisibility(View.GONE);
        btnStatus.setEnabled(true);
        isProcessing = false;
    }

    private void openCamera() {
        try {
            camera = Camera.open(0);
            camera.setDisplayOrientation(90);
            if (surfaceHolder.getSurface() != null) {
                camera.setPreviewDisplay(surfaceHolder);
                camera.startPreview();
            }
        } catch (Exception e) {
            btnStatus.setText("Không thể mở camera");
            e.printStackTrace();
        }
    }

    private void releaseCamera() {
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
    public void surfaceCreated(SurfaceHolder holder) {
        openCamera();
    }

    @Override
    public void surfaceChanged(SurfaceHolder holder, int format, int width, int height) {
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
}
