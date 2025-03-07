package com.example.essgrading.Activity.Test;

import android.content.Intent;
import android.os.Bundle;
import android.widget.ImageView;
import android.widget.Spinner;
import android.widget.TextView;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.example.essgrading.Activity.BaseActivity;
import com.example.essgrading.Adapter.ScoreReportAdapter;
import com.example.essgrading.Model.ScoreModel;
import com.example.essgrading.R;
import java.util.ArrayList;
import java.util.List;

public class ScoreReportActivity extends BaseActivity {

    private TextView txtMaxScore, txtMinScore, txtAverageScore;
    private Spinner spinnerThreshold;
    private RecyclerView recyclerViewScores;
    private ScoreReportAdapter scoreAdapter;
    private List<ScoreModel> scoreList;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_scorereport);
        setupDrawer();
        setHeaderTitle("Báo cáo điểm");

        // Nhận dữ liệu từ TestOptionActivity
        Intent intent = getIntent();
        String selectedExCode = intent.getStringExtra("selectedExCode");

        // Ánh xạ View
        txtMaxScore = findViewById(R.id.txtMaxScore);
        txtMinScore = findViewById(R.id.txtMinScore);
        txtAverageScore = findViewById(R.id.txtAverageScore);
        spinnerThreshold = findViewById(R.id.spinnerThreshold);
        recyclerViewScores = findViewById(R.id.recyclerViewScores);
        ImageView btnFilter = findViewById(R.id.btnFilter);

        // Dữ liệu giả lập điểm số
        scoreList = new ArrayList<>();
        scoreList.add(new ScoreModel("Hoàng Thu Phương", "HE172276", 8.25));
        scoreList.add(new ScoreModel("Phòng Hoàng Lam", "HE170159", 7.5));

        // Tính toán điểm
        double maxScore = 8.25;
        double minScore = 7.5;
        double avgScore = (maxScore + minScore) / 2;

        txtMaxScore.setText("Cao nhất: " + maxScore);
        txtMinScore.setText("Thấp nhất: " + minScore);
        txtAverageScore.setText("Điểm trung bình: " + avgScore);

        // Setup RecyclerView
        scoreAdapter = new ScoreReportAdapter(scoreList);
        recyclerViewScores.setLayoutManager(new LinearLayoutManager(this));
        recyclerViewScores.setAdapter(scoreAdapter);
    }
}
