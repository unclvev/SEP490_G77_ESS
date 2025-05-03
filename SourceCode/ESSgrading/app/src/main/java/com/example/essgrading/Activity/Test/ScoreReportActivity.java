package com.example.essgrading.Activity.Test;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ImageView;
import android.widget.Spinner;
import android.widget.TextView;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.essgrading.API.ApiConfig;
import com.example.essgrading.Activity.BaseActivity;
import com.example.essgrading.Adapter.ScoreReportAdapter;
import com.example.essgrading.Interface.SearchHandler;
import com.example.essgrading.Model.ScoreModel;
import com.example.essgrading.R;
import com.example.essgrading.API.ApiService;
import com.example.essgrading.Utils.RetrofitClient;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class ScoreReportActivity extends BaseActivity implements SearchHandler {

    private TextView txtMaxScore, txtMinScore, txtAverageScore;
    private Spinner spinnerThreshold;
    private RecyclerView recyclerViewScores;
    private ScoreReportAdapter scoreAdapter;
    private List<ScoreModel> scoreList, searchScoreList;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_scorereport);
        setupDrawer();
        setHeaderTitle("Báo cáo điểm");

        // Nhận dữ liệu từ TestOptionActivity
        Intent intent = getIntent();
        int testId = Integer.parseInt(intent.getStringExtra("testId"));

        // Ánh xạ View
        txtMaxScore = findViewById(R.id.txtMaxScore);
        txtMinScore = findViewById(R.id.txtMinScore);
        txtAverageScore = findViewById(R.id.txtAverageScore);
        spinnerThreshold = findViewById(R.id.spinnerThreshold);
        recyclerViewScores = findViewById(R.id.recyclerViewScores);
        TextView txtThresholdResult = findViewById(R.id.txtThresholdResult);

        // Khởi tạo danh sách & Adapter
        scoreList = new ArrayList<>();
        searchScoreList = new ArrayList<>();
        scoreAdapter = new ScoreReportAdapter(searchScoreList); // dùng searchScoreList
        recyclerViewScores.setLayoutManager(new LinearLayoutManager(this));
        recyclerViewScores.setAdapter(scoreAdapter);

        // Gọi API với Retrofit
        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl(ApiConfig.BASE_URL)
                .addConverterFactory(GsonConverterFactory.create())
                .build();
        ApiService apiService = RetrofitClient.getInstance(this, getString(R.string.base_url)).create(ApiService.class);
        Call<List<ScoreModel>> call = apiService.getScoreReport(testId);

        call.enqueue(new Callback<List<ScoreModel>>() {
            @Override
            public void onResponse(Call<List<ScoreModel>> call, Response<List<ScoreModel>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    List<ScoreModel> responseList = response.body();
                    scoreList.clear();
                    searchScoreList.clear();

                    // Lọc ra những học sinh có điểm
                    List<ScoreModel> scoredStudents = new ArrayList<>();
                    for (ScoreModel s : responseList) {
                        if (s.getScore() != null) {
                            scoredStudents.add(s);
                        }
                    }

                    double max = Double.MIN_VALUE;
                    double min = Double.MAX_VALUE;
                    double total = 0;

                    for (ScoreModel score : scoredStudents) {
                        double s = Double.parseDouble(score.getScore());
                        max = Math.max(max, s);
                        min = Math.min(min, s);
                        total += s;
                    }

                    double avg = scoredStudents.size() > 0 ? total / scoredStudents.size() : 0;

                    txtMaxScore.setText("Cao nhất: " + (scoredStudents.size() > 0 ? max : "N/A"));
                    txtMinScore.setText("Thấp nhất: " + (scoredStudents.size() > 0 ? min : "N/A"));
                    txtAverageScore.setText("Điểm trung bình: " + (scoredStudents.size() > 0 ? String.format("%.2f", avg) : "N/A"));

                    // Thêm tất cả vào danh sách hiển thị
                    scoreList.addAll(responseList);
                    searchScoreList.addAll(responseList);
                    scoreAdapter.notifyDataSetChanged();
                }
            }

            @Override
            public void onFailure(Call<List<ScoreModel>> call, Throwable t) {
                txtAverageScore.setText("Lỗi tải dữ liệu");
                t.printStackTrace();
            }
        });
        spinnerThreshold.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                String selected = spinnerThreshold.getSelectedItem().toString(); // ví dụ: "5", "6", ...
                double threshold = Double.parseDouble(selected);

                // Đếm số học sinh có điểm >= threshold
                int passedCount = 0;
                int total = 0;
                for (ScoreModel s : scoreList) {
                    if (s.getScore() != null) {
                        double score = Double.parseDouble(s.getScore());
                        if (score >= threshold) passedCount++;
                        total++;
                    }
                }

                double percent = total > 0 ? (passedCount * 100.0 / total) : 0;
                txtThresholdResult.setText(String.format("%.2f%%", percent));
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {
                txtThresholdResult.setText("0%");
            }
        });

    }

    // Xử lý sự kiện search text
    @Override
    public void onSearchTextChanged(String keyword) {
        searchScoreList.clear();
        if (keyword.isEmpty()) {
            searchScoreList.addAll(scoreList);
        } else {
            for (ScoreModel item : scoreList) {
                if (item.getStudentName().toLowerCase().contains(keyword.toLowerCase()) ||
                        item.getStudentId().toLowerCase().contains(keyword.toLowerCase())) {
                    searchScoreList.add(item);
                }
            }
        }
        scoreAdapter.notifyDataSetChanged();
    }
}
