package com.example.essgrading.Activity.Test;

import static android.widget.Toast.LENGTH_SHORT;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.hardware.Camera;
import android.os.Bundle;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
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
import retrofit2.*;
import retrofit2.converter.gson.GsonConverterFactory;

public class GradingActivity extends BaseActivity implements SurfaceHolder.Callback {

    private static final int CAMERA_PERMISSION_REQUEST_CODE = 100;
    private SurfaceView cameraView;
    private SurfaceHolder surfaceHolder;
    private Camera camera;
    private TextView btnStatus;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_grading);
        setupDrawer();
        setHeaderTitle("Chấm điểm");

        Intent intent = getIntent();
        String selectedExCode = intent.getStringExtra("selectedExCode");

        cameraView = findViewById(R.id.cameraPreview);
        btnStatus = findViewById(R.id.btnStatus);

        surfaceHolder = cameraView.getHolder();
        surfaceHolder.addCallback(this);
        surfaceHolder.setType(SurfaceHolder.SURFACE_TYPE_PUSH_BUFFERS);

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            openCamera();
        } else {
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.CAMERA}, CAMERA_PERMISSION_REQUEST_CODE);
        }

        btnStatus.setOnClickListener(v -> {
            if (camera != null){
                btnStatus.setEnabled(false); // Vô hiệu hóa nút
                camera.takePicture(null, null, pictureCallback);
            }
        });
    }

    private final Camera.PictureCallback pictureCallback = (data, camera) -> {
        btnStatus.setText("📷 Đang xử lý...");

        new Thread(() -> {
            try {
                Bitmap bitmap = BitmapFactory.decodeByteArray(data, 0, data.length);
                ByteArrayOutputStream stream = new ByteArrayOutputStream();
//                bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream);
                bitmap.compress(Bitmap.CompressFormat.JPEG, 60, stream); // nén ở mức 60%
                byte[] imageBytes = stream.toByteArray();

                RequestBody requestFile = RequestBody.create(MediaType.parse("image/png"), imageBytes);
                MultipartBody.Part body = MultipartBody.Part.createFormData("image", "scan.png", requestFile);

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
                        runOnUiThread(() -> {
                            try {
                                if (response.isSuccessful() && response.body() != null) {
                                    String result = response.body().string();
                                    JSONObject json = new JSONObject(result);
                                    JSONArray qr = json.getJSONArray("qr_content");
                                    String score = json.getString("score");
                                    String code = json.getString("student_code");
                                    Toast.makeText(GradingActivity.this, "Thành công",LENGTH_SHORT).show();
                                    btnStatus.setText("✅ Mã QR: " + qr.getString(0) + "\nĐiểm: " + score + "\nSBD: " + code + "\n📷Ấn để chụp tiếp");
                                    btnStatus.setEnabled(true);

                                } else {
                                    btnStatus.setText("❌ Lỗi phản hồi: " + response.code() + "\n📷Ấn để chụp tiếp");
                                    btnStatus.setEnabled(true); // Kích hoạt lại
                                }
                            } catch (Exception e) {
                                btnStatus.setText("❌ Lỗi đọc kết quả" + "\n📷Ấn để chụp tiếp");
                                btnStatus.setEnabled(true); // Kích hoạt lại
                                e.printStackTrace();
                            }
                        });
                    }

                    @Override
                    public void onFailure(Call<ResponseBody> call, Throwable t) {
                        runOnUiThread(() -> {
                            btnStatus.setText("❌ Gửi ảnh thất bại");
                            t.printStackTrace();
                        });
                    }
                });

            } catch (Exception e) {
                runOnUiThread(() -> {
                    btnStatus.setText("❌ Lỗi xử lý ảnh");
                    e.printStackTrace();
                });
            } finally {
//                runOnUiThread(() -> camera.startPreview());
            }
        }).start();
    };

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
