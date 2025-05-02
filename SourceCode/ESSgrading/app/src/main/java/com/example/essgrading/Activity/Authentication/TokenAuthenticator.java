package com.example.essgrading.Activity.Authentication;

import android.content.Context;
import android.content.Intent;

import com.example.essgrading.API.ApiConfig;
import com.example.essgrading.API.ApiService;
import com.example.essgrading.Activity.Authentication.TokenManager;
import com.example.essgrading.Activity.Authentication.TokenResponse;

import java.io.IOException;

import okhttp3.Authenticator;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.Route;

import retrofit2.Call;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;


public class TokenAuthenticator implements Authenticator {
    private TokenManager tokenManager;
    private Context context;

    public TokenAuthenticator(Context context, TokenManager tokenManager) {
        this.context = context.getApplicationContext();
        this.tokenManager = tokenManager;
    }

    @Override
    public Request authenticate(Route route, Response response) throws IOException {
        if (response.request().header("Authorization") != null) {
            String refreshToken = tokenManager.getRefreshToken();

            if (refreshToken == null) return null;

            // Gọi API refresh (sử dụng Retrofit đồng bộ)
            Retrofit retrofit = new Retrofit.Builder()
                    .baseUrl(ApiConfig.BASE_URL)
                    .addConverterFactory(GsonConverterFactory.create())
                    .build();

            ApiService service = retrofit.create(ApiService.class);
            Call<TokenResponse> call = service.refreshToken(refreshToken);
            retrofit2.Response<TokenResponse> refreshResponse = call.execute();

            if (refreshResponse.isSuccessful() && refreshResponse.body() != null) {
                String newAccessToken = refreshResponse.body().getAccessToken();
                tokenManager.saveTokens(newAccessToken, refreshToken);

                return response.request().newBuilder()
                        .header("Authorization", "Bearer " + newAccessToken)
                        .build();
            } else {
                tokenManager.clear(); // Xóa token đã lưu
                Intent intent = new Intent("com.example.essgrading.LOGOUT");
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.sendBroadcast(intent);
                return null;
            }
        }
        return null;
    }
}

