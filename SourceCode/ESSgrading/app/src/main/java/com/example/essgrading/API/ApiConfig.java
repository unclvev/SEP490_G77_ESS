package com.example.essgrading.API;

import android.content.Context;
import com.example.essgrading.MyApplication; // Giả sử bạn có Application class tên MyApplication
import com.example.essgrading.R;

public class ApiConfig {
    private static Context context = MyApplication.getContext();

    public static final String BASE_URL = context.getString(R.string.base_url);
    public static final String UPLOAD_URL = context.getString(R.string.upload_url);
}