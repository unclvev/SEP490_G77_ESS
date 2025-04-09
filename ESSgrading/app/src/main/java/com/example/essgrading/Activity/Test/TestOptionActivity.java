package com.example.essgrading.Activity.Test;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;

import com.example.essgrading.Activity.BaseActivity;
import com.example.essgrading.Activity.Test.GradingActivity;
import com.example.essgrading.Activity.Test.ListAnswerActivity;
import com.example.essgrading.R;

import java.util.ArrayList;

public class TestOptionActivity extends BaseActivity {

    private Button btnCorrectAnswers, btnGrading, btnScoreReport;
    private TextView txtTitle, txtClass, txtType, txtDate;

    private String testTitle, classCode, testType, testDate, id;
    private ArrayList<String> exCodes;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_testoption);
        setupDrawer();
        setHeaderTitle("Bài kiểm tra");

        // Nhận từ TestListActivity
        Intent intent = getIntent();
        id = intent.getStringExtra("testId");
        testTitle = intent.getStringExtra("testTitle");
        classCode = intent.getStringExtra("classCode");
        testType = intent.getStringExtra("testType");
        testDate = intent.getStringExtra("testDate");
        exCodes = intent.getStringArrayListExtra("exCodes");

        // Ánh xạ view
        txtTitle = findViewById(R.id.txtTitle);
        txtClass = findViewById(R.id.txtClass);
        txtType = findViewById(R.id.txtType);
        txtDate = findViewById(R.id.txtDate);

        txtTitle.setText(testTitle);
        txtClass.setText(classCode);
        txtType.setText(testType);
        txtDate.setText(testDate);

        btnCorrectAnswers = findViewById(R.id.btnCorrectAnswers);
        btnGrading = findViewById(R.id.btnGrading);
        btnScoreReport = findViewById(R.id.btnScoreReport);

        btnCorrectAnswers.setOnClickListener(v -> {
            Intent intent1 = new Intent(TestOptionActivity.this, SelectExCodeActivity.class);
            intent1.putExtra("testId", id);
            intent1.putExtra("testTitle", testTitle);
            intent1.putExtra("classCode", classCode);
            intent1.putStringArrayListExtra("exCodes", exCodes);
            startActivity(intent1);
        });

        btnGrading.setOnClickListener(v -> {
            Intent intent2 = new Intent(TestOptionActivity.this, GradingActivity.class);
            intent2.putExtra("testId", id);
            intent2.putExtra("testTitle", testTitle);
            intent2.putExtra("classCode", classCode);
            startActivity(intent2);
        });

        btnScoreReport.setOnClickListener(v -> {
            Intent intent3 = new Intent(TestOptionActivity.this, ScoreReportActivity.class);
            intent3.putExtra("testId", id);
            intent3.putExtra("testTitle", testTitle);
            intent3.putExtra("classCode", classCode);
            startActivity(intent3);
        });
    }
}
