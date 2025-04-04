package com.example.essgrading.Activity.Test;

import android.content.Intent;
import android.os.Bundle;
import android.widget.ImageView;
import android.widget.Spinner;
import android.widget.TextView;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.essgrading.API.ApiConfig;
import com.example.essgrading.Activity.BaseActivity;
import com.example.essgrading.Adapter.ScoreReportAdapter;
import com.example.essgrading.Model.ScoreModel;
import com.example.essgrading.R;
import com.example.essgrading.API.ApiService;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

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

        // Khởi tạo danh sách & Adapter
        scoreList = new ArrayList<>();
        scoreAdapter = new ScoreReportAdapter(scoreList);
        recyclerViewScores.setLayoutManager(new LinearLayoutManager(this));
        recyclerViewScores.setAdapter(scoreAdapter);

        // Gọi API với Retrofit
        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl(ApiConfig.BASE_URL)
                .addConverterFactory(GsonConverterFactory.create())
                .build();

        ApiService apiService = retrofit.create(ApiService.class);
        Call<List<ScoreModel>> call = apiService.getScoreReport(1);

        call.enqueue(new Callback<List<ScoreModel>>() {
            @Override
            public void onResponse(Call<List<ScoreModel>> call, Response<List<ScoreModel>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    List<ScoreModel> responseList = response.body();
                    scoreList.clear();

                    double max = Double.MIN_VALUE;
                    double min = Double.MAX_VALUE;
                    double total = 0;

                    for (ScoreModel score : responseList) {
                        scoreList.add(score); // vì API trả đúng ScoreModel rồi
                        max = Math.max(max, score.getScore());
                        min = Math.min(min, score.getScore());
                        total += score.getScore();
                    }

                    double avg = responseList.size() > 0 ? total / responseList.size() : 0;

                    txtMaxScore.setText("Cao nhất: " + max);
                    txtMinScore.setText("Thấp nhất: " + min);
                    txtAverageScore.setText("Điểm trung bình: " + avg);

                    scoreAdapter.notifyDataSetChanged();
                }
            }

            @Override
            public void onFailure(Call<List<ScoreModel>> call, Throwable t) {
                txtAverageScore.setText("Lỗi tải dữ liệu");
                t.printStackTrace();
            }
        });
    }
}
