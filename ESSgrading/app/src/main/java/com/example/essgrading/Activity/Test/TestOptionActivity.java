package com.example.essgrading.Activity.Test;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;

import com.example.essgrading.Activity.BaseActivity;
import com.example.essgrading.Activity.Test.GradingActivity;
import com.example.essgrading.Activity.Test.ListAnswerActivity;
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

        // 🔹 Xử lý sự kiện khi nhấn "Đáp án đúng"
        btnCorrectAnswers.setOnClickListener(v -> {
            Intent answerIntent = new Intent(TestOptionActivity.this, ListAnswerActivity.class);
            answerIntent.putExtra("testTitle", testTitle);
            answerIntent.putExtra("classCode", classCode);
            answerIntent.putExtra("selectedExCode", selectedExCode);
            startActivity(answerIntent);
        });

        // 🔹 Xử lý sự kiện khi nhấn "Chấm bài kiểm tra"
        btnGrading.setOnClickListener(v -> {
            Intent gradingIntent = new Intent(TestOptionActivity.this, GradingActivity.class);
            gradingIntent.putExtra("testTitle", testTitle);
            gradingIntent.putExtra("classCode", classCode);
            gradingIntent.putExtra("selectedExCode", selectedExCode);
            startActivity(gradingIntent);
        });
    }
}
