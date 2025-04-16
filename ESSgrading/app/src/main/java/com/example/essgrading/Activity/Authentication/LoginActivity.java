package com.example.essgrading.Activity.Authentication;

import static com.example.essgrading.API.ApiConfig.BASE_URL;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.example.essgrading.API.ApiService;
import com.example.essgrading.Activity.MainActivity;
import com.example.essgrading.Model.LoginRequest;
import com.example.essgrading.Model.LoginResponse;
import com.example.essgrading.R;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;
import com.auth0.jwt.JWT;
import com.auth0.jwt.interfaces.DecodedJWT;

public class LoginActivity extends AppCompatActivity {

    private EditText edtEmail, edtPassword;
    private Button btnLogin;

    private String email, password, username;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        edtEmail = findViewById(R.id.edtEmail);
        edtPassword = findViewById(R.id.edtPassword);
        btnLogin = findViewById(R.id.btnLogin);

        // Kiểm tra nếu đã đăng nhập
        checkIfLoggedIn();

        btnLogin.setOnClickListener(v -> {
            email = edtEmail.getText().toString().trim();
            password = edtPassword.getText().toString().trim();

            if (!email.isEmpty() && !password.isEmpty()) {
                LoginRequest request = new LoginRequest(email, password);

                Retrofit retrofit = new Retrofit.Builder()
                        .baseUrl(BASE_URL) // Đảm bảo IP backend chính xác
                        .addConverterFactory(GsonConverterFactory.create())
                        .build();

                ApiService apiService = retrofit.create(ApiService.class);
                Call<LoginResponse> call = apiService.login(request);

                call.enqueue(new Callback<LoginResponse>() {
                    @Override
                    public void onResponse(Call<LoginResponse> call, Response<LoginResponse> response) {
                        if (response.isSuccessful() && response.body() != null) {
                            String token = response.body().getToken();
                            saveTokenToPreferences(token);

                            Toast.makeText(LoginActivity.this, "Đăng nhập thành công", Toast.LENGTH_SHORT).show();

                            startActivity(new Intent(LoginActivity.this, MainActivity.class));
                            finish();
                        } else {
                            Toast.makeText(LoginActivity.this, "Sai tài khoản hoặc mật khẩu!", Toast.LENGTH_SHORT).show();
                        }
                    }

                    @Override
                    public void onFailure(Call<LoginResponse> call, Throwable t) {
                        Toast.makeText(LoginActivity.this, "Lỗi kết nối: " + t.getMessage(), Toast.LENGTH_SHORT).show();
                    }
                });

            } else {
                Toast.makeText(LoginActivity.this, "Vui lòng nhập email và mật khẩu!", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void saveTokenToPreferences(String token) {
        SharedPreferences prefs = getSharedPreferences("UserPrefs", MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        getAccNameByToken(token);
        editor.putString("jwtToken", token);
        editor.putString("userEmail", email);
        editor.putString("userName", username);
        editor.apply();
    }
    private void checkIfLoggedIn() {
        SharedPreferences prefs = getSharedPreferences("UserPrefs", MODE_PRIVATE);
        String token = prefs.getString("jwtToken", null);
        if (token != null) {
            startActivity(new Intent(LoginActivity.this, MainActivity.class));
            finish();
        }
    }

    public void getAccNameByToken(String token) {
        try {
            DecodedJWT decodedJWT = JWT.decode(token);
            username = decodedJWT.getClaim("AccName").asString();
        } catch (Exception e) {
            e.printStackTrace();
            Toast.makeText(this, "Lỗi giải mã token", Toast.LENGTH_SHORT).show();
        }
    }
}
