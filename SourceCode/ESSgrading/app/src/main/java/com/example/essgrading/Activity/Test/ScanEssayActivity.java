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
import android.util.Log;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.example.essgrading.API.ApiService;
import com.example.essgrading.Activity.BaseActivity;
import com.example.essgrading.R;
import com.example.essgrading.Utils.CameraHelper;
import com.example.essgrading.Utils.RetrofitClient;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.Objects;

import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.RequestBody;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ScanEssayActivity extends BaseActivity implements SurfaceHolder.Callback {

    private static final int CAMERA_PERMISSION_REQUEST_CODE = 100;
    private SurfaceView cameraView;
    private SurfaceHolder surfaceHolder;
    private Camera camera;
    private TextView btnStatus, btnDevice;
    private boolean isCameraProcessing, isDeviceProcessing = false;
    private String examId, type;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_scanessayin4);
        setupDrawer();
        setHeaderTitle("Quét thông tin");

        examId = getIntent().getStringExtra("testId");
        type = getIntent().getStringExtra("type");
        if(Objects.equals(type, "info-a3")){
            setHeaderTitle("Quét thông tin A3");
        } else if (Objects.equals(type, "info-a4")){
            setHeaderTitle("Quét thông tin A4");
        } else if (Objects.equals(type, "score-a3")) {
            setHeaderTitle("Nhập điểm A3");
        } else setHeaderTitle("Nhập điểm A4");

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
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.CAMERA}, CAMERA_PERMISSION_REQUEST_CODE);
        }

        btnStatus.setOnClickListener(v -> {
            if (camera != null && !isCameraProcessing) {
                isCameraProcessing = true;
                btnStatus.setEnabled(false);
                btnDevice.setEnabled(false);
                camera.takePicture(null, null, pictureCallback);
            }
        });

        btnDevice.setOnClickListener(v -> openGallery());
    }

    private void openGallery() {
        Intent intent = new Intent(Intent.ACTION_PICK);
        intent.setType("image/*");
        startActivityForResult(intent, 1);
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
            btnDevice.setEnabled(false);
            btnStatus.setEnabled(false);
        });

        new Thread(() -> {
            try {
                ByteArrayOutputStream stream = new ByteArrayOutputStream();
                bitmap.compress(Bitmap.CompressFormat.JPEG, 60, stream);
                byte[] imageBytes = stream.toByteArray();

                RequestBody requestFile = RequestBody.create(MediaType.parse("image/jpeg"), imageBytes);
                MultipartBody.Part imagePart = MultipartBody.Part.createFormData("image", "scan.jpg", requestFile);

                RequestBody typePart = RequestBody.create(
                        MediaType.parse("text/plain"), type
                );

                ApiService apiService = RetrofitClient.getInstance(this, getString(R.string.upload_url)).create(ApiService.class);
                Call<ResponseBody> call = apiService.uploadEssay(imagePart, typePart, examId);

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
            Log.d("API_DEBUG", "error: " + error.getMessage());
        } else if (response != null && response.isSuccessful() && response.body() != null) {
            try {
                String result = response.body().string();
                JSONObject json = new JSONObject(result);
                JSONArray qrArr = json.getJSONArray("qr_content");
                String qrCode = qrArr.length() > 0 ? qrArr.getString(0) : "N/A";
                String content;
                if (type.startsWith("info")) {
                    String studentCode = json.optString("student_code", "N/A");
                    content = "Mã QR: " + qrCode + "\nSBD: " + studentCode;
                } else {
                    String score = json.optString("score", "N/A");
                    content = "Mã QR: " + qrCode + "\nĐiểm: " + score;
                }
                showResultDialog(content);
            } catch (Exception e) {
                Toast.makeText(this, "❌ Lỗi đọc kết quả", LENGTH_SHORT).show();
                e.printStackTrace();
            }
        } else {
            int code = (response != null ? response.code() : -1);
            String message = "❌" + code;

            try {
                if (response != null && response.errorBody() != null) {
                    String errorBody = response.errorBody().string();
                    JSONObject jsonError = new JSONObject(errorBody);
                    if (jsonError.has("error")) {
                        message += ": " + jsonError.getString("error");
                    }
                }
            } catch (Exception ex) {
                ex.printStackTrace();
            }

            Toast.makeText(this, message, LENGTH_SHORT).show();
        }

        if (camera == null && surfaceHolder != null && surfaceHolder.getSurface().isValid()) {
            openCamera();
        } else if (camera != null) {
            camera.startPreview();
        }
        btnDevice.setText("Thiết bị");
        btnDevice.setEnabled(true);
        btnStatus.setText("📷Ấn để chụp tiếp");
        btnStatus.setEnabled(true);
        isCameraProcessing = false;
        isDeviceProcessing = false;
    }

    private void showResultDialog(String content) {
        View dialogView = getLayoutInflater().inflate(R.layout.dialog_scan_result, null);
        TextView tvContent = dialogView.findViewById(R.id.tvResultContent);
        Button btnClose = dialogView.findViewById(R.id.btnCloseDialog);

        tvContent.setText(content);

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
        if (camera == null
                && surfaceHolder != null
                && surfaceHolder.getSurface().isValid()
                && !isCameraProcessing
                && !isDeviceProcessing)
        {
            btnStatus.setText("Chụp");
        }
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
        }
    }
}
