package com.example.essgrading.Activity.Test;

import android.content.Intent;
import android.os.Bundle;
import android.widget.TextView;
import android.widget.Toast;

import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.example.essgrading.Activity.BaseActivity;
import com.example.essgrading.Adapter.AnswerAdapter;
import com.example.essgrading.Model.CorrectAnswer;
import com.example.essgrading.R;
import java.util.ArrayList;
import java.util.List;
import com.example.essgrading.API.ApiService;
import com.example.essgrading.Utils.RetrofitClient;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ListAnswerActivity extends BaseActivity {

    private RecyclerView recyclerViewAnswers;
    private TextView txtExCode;
    private List<int[]> answerData = new ArrayList<>();
    private String selectedExCode;
    private String examId;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_listanswer);
        setupDrawer();
        setHeaderTitle("Đáp án đúng");

        selectedExCode = getIntent().getStringExtra("selectedExCode");
        examId = getIntent().getStringExtra("examId");

        recyclerViewAnswers = findViewById(R.id.recyclerViewAnswers);
        txtExCode = findViewById(R.id.txtExCode);
        txtExCode.setText("Mã đề " + selectedExCode);

        fetchCorrectAnswers();
    }

    private void fetchCorrectAnswers() {
        ApiService apiService = RetrofitClient.getInstance(this, getString(R.string.base_url)).create(ApiService.class);
        apiService.getCorrectAnswers(examId, selectedExCode).enqueue(new Callback<List<CorrectAnswer>>() {
            @Override
            public void onResponse(Call<List<CorrectAnswer>> call, Response<List<CorrectAnswer>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    answerData.clear();
                    for (CorrectAnswer answer : response.body()) {
                        int[] optionArray = new int[4];
                        switch (answer.getCorrectAnswer()) {
                            case "A": optionArray[0] = 1; break;
                            case "B": optionArray[1] = 1; break;
                            case "C": optionArray[2] = 1; break;
                            case "D": optionArray[3] = 1; break;
                        }
                        answerData.add(optionArray);
                    }
                    AnswerAdapter adapter = new AnswerAdapter(answerData);
                    recyclerViewAnswers.setLayoutManager(new LinearLayoutManager(ListAnswerActivity.this));
                    recyclerViewAnswers.setAdapter(adapter);
                }
            }

            @Override
            public void onFailure(Call<List<CorrectAnswer>> call, Throwable t) {
                Toast.makeText(ListAnswerActivity.this, "Lỗi tải đáp án", Toast.LENGTH_SHORT).show();
            }
        });
    }
}