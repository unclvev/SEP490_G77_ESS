package com.example.essgrading.Activity.Test;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;

import com.example.essgrading.Activity.BaseActivity;
import com.example.essgrading.R;

public class TestOptionActivity extends BaseActivity {

    private Button btnCorrectAnswers, btnGrading;
    private TextView txtExCode;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_testoption);
        setupDrawer();
        setHeaderTitle("Bài kiểm tra");

        // Nhận dữ liệu từ SelectExCodeActivity
        Intent intent = getIntent();
        String testTitle = intent.getStringExtra("testTitle");
        String classCode = intent.getStringExtra("classCode");
        String selectedExCode = intent.getStringExtra("selectedExCode");

        // Ánh xạ View
        txtExCode = findViewById(R.id.txtExCode);
        btnCorrectAnswers = findViewById(R.id.btnCorrectAnswers);
        btnGrading = findViewById(R.id.btnGrading);

        // Hiển thị mã đề
        txtExCode.setText("Mã đề " + selectedExCode);
    }
}
