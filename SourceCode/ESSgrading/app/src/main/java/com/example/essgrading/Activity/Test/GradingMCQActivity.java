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
import com.example.essgrading.Utils.RetrofitClient;

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

public class GradingMCQActivity extends BaseActivity implements SurfaceHolder.Callback {

    private static final int CAMERA_PERMISSION_REQUEST_CODE = 100;
    private SurfaceView cameraView;
    private SurfaceHolder surfaceHolder;
    private Camera camera;
    private TextView btnStatus;
    private boolean isProcessing = false;
    private int examId;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_gradingmcq);
        setupDrawer();
        setHeaderTitle("Chấm điểm");

        // Lấy examId từ Intent
        Intent intent = getIntent();
        examId = intent.getIntExtra("testId", -1);

        cameraView    = findViewById(R.id.cameraPreview);
        btnStatus     = findViewById(R.id.btnStatus);

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
//                bmp.compress(Bitmap.CompressFormat.PNG, 100, stream);
                bmp.compress(Bitmap.CompressFormat.JPEG, 60, stream);
                byte[] imageBytes = stream.toByteArray();

                // Tạo phần file
                RequestBody requestFile = RequestBody.create(
                        MediaType.parse("image/jpeg"),
                        imageBytes
                );
                MultipartBody.Part filePart = MultipartBody.Part.createFormData(
                        "file",        // phải trùng với tên field trong Swagger (/mcq/detect)
                        "scan.jpg",
                        requestFile
                );

                // Tạo phần exam_id
                RequestBody examIdPart = RequestBody.create(
                        MediaType.parse("text/plain"),
                        String.valueOf(examId)
                );

                // Khởi tạo Retrofit với timeout
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

                ApiService apiService = RetrofitClient.getInstance(this, getString(R.string.upload_url)).create(ApiService.class);
                Call<ResponseBody> call = apiService.uploadMCQ(filePart, examIdPart);
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
        // 1) Lỗi kết nối
        if (error != null) {
            Toast.makeText(this, "❌ Gửi ảnh thất bại", LENGTH_SHORT).show();
        }
        else {
            String payload = null;
            try {
                if (response.isSuccessful()) {
                    // Thành công 200, đọc từ body()
                    payload = response.body().string();
                } else if (response.errorBody() != null) {
                    // Lỗi 400, 500..., đọc từ errorBody()
                    payload = response.errorBody().string();
                }
            } catch (Exception e) {
                e.printStackTrace();
            }

            if (payload != null) {
                try {
                    JSONObject json = new JSONObject(payload);
                    // Nếu có key "error" thì show lỗi
                    if (json.has("error")) {
                        String errMsg = json.getString("error");
                        new AlertDialog.Builder(this)
                                .setTitle("Không thể chấm điểm")
                                .setMessage(errMsg)
                                .setPositiveButton("Đóng", null)
                                .show();
                    }
                    // Ngược lại, parse phần trả về thành công
                    else {
                        String examCode   = json.optString("exam_code");
                        int    returnedId = json.optInt("exam_id");
                        double score      = json.optDouble("score");
                        String studentId  = json.optString("student_id");

                        String content = "Mã đề: "   + examCode  + "\n"
                                + "Exam ID: " + returnedId + "\n"
                                + "Điểm: "    + score     + "\n"
                                + "SBD: "     + studentId;

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
                // Nếu không lấy được payload, show mã lỗi HTTP
                int code = response != null ? response.code() : -1;
                Toast.makeText(this, "❌ Lỗi phản hồi: " + code, LENGTH_SHORT).show();
            }
        }

        // Reset camera preview & UI
        if (camera != null) camera.startPreview();
        btnStatus.setText("📷 Ấn để chụp tiếp");
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
}
