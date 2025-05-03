package com.example.essgrading.Activity.Test;

import android.content.Intent;
import android.os.Bundle;
import android.widget.TextView;
import android.widget.Toast;

import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.example.essgrading.Activity.BaseActivity;
import com.example.essgrading.Adapter.ExCodeAdapter;
import com.example.essgrading.R;
import java.util.List;
import com.example.essgrading.API.ApiService;
import com.example.essgrading.Utils.RetrofitClient;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class SelectExCodeActivity extends BaseActivity {

    private RecyclerView recyclerViewExCodes;
    private TextView txtTestTitle, txtClassCode, txtHeader;
    private List<String> exCodeList;
    private String testTitle, classCode, examId;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_selectexcode);
        setupDrawer();
        setHeaderTitle("Bài kiểm tra");

        Intent intent = getIntent();
        testTitle = intent.getStringExtra("testTitle");
        classCode = intent.getStringExtra("classCode");
        examId = intent.getStringExtra("testId");

        txtTestTitle = findViewById(R.id.txtTestTitle);
        txtClassCode = findViewById(R.id.txtClassCode);
        txtHeader = findViewById(R.id.txtHeader);
        recyclerViewExCodes = findViewById(R.id.recyclerViewExCodes);

        txtTestTitle.setText(testTitle);
        txtClassCode.setText(classCode);

        fetchExamCodes();
    }

    private void fetchExamCodes() {
        ApiService apiService = RetrofitClient.getInstance(this, getString(R.string.base_url)).create(ApiService.class);
        apiService.getExamCodes(examId).enqueue(new Callback<List<String>>() {
            @Override
            public void onResponse(Call<List<String>> call, Response<List<String>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    exCodeList = response.body();
                    ExCodeAdapter adapter = new ExCodeAdapter(exCodeList, selectedExCode -> {
                        Intent answerIntent = new Intent(SelectExCodeActivity.this, ListAnswerActivity.class);
                        answerIntent.putExtra("testTitle", testTitle);
                        answerIntent.putExtra("classCode", classCode);
                        answerIntent.putExtra("examId", examId);
                        answerIntent.putExtra("selectedExCode", selectedExCode);
                        startActivity(answerIntent);
                    });
                    recyclerViewExCodes.setLayoutManager(new GridLayoutManager(SelectExCodeActivity.this, 2));
                    recyclerViewExCodes.setAdapter(adapter);
                }
            }

            @Override
            public void onFailure(Call<List<String>> call, Throwable t) {
                Toast.makeText(SelectExCodeActivity.this, "Không thể tải mã đề", Toast.LENGTH_SHORT).show();
            }
        });
    }
}
