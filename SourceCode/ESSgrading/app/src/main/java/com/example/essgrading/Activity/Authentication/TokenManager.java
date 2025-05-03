package com.example.essgrading.Activity.Authentication;

import android.content.Context;
import android.content.SharedPreferences;

public class TokenManager {
    private SharedPreferences prefs;

    public TokenManager(Context context) {
        prefs = context.getSharedPreferences("UserPrefs", Context.MODE_PRIVATE);
    }

    public String getAccessToken() {
        return prefs.getString("jwtToken", null);
    }

    public String getRefreshToken() {
        return prefs.getString("refreshToken", null);
    }

    public void saveTokens(String accessToken, String refreshToken) {
        prefs.edit()
                .putString("jwtToken", accessToken)
                .putString("refreshToken", refreshToken)
                .apply();
    }

    public void clear() {
        prefs.edit().clear().apply();
    }
}

