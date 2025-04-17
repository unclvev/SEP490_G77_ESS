package com.example.essgrading.Activity.Test;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Toast;

import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.essgrading.API.ApiConfig;
import com.example.essgrading.API.ApiService;
import com.example.essgrading.Activity.BaseActivity;
import com.example.essgrading.Adapter.TestAdapter;
import com.example.essgrading.Interface.SearchHandler;
import com.example.essgrading.Model.ScoreModel;
import com.example.essgrading.Model.TestModel;
import com.example.essgrading.R;
import com.google.android.material.floatingactionbutton.FloatingActionButton;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Locale;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class TestListActivity extends BaseActivity implements SearchHandler {

    private RecyclerView recyclerViewTests;
    private FloatingActionButton fabAddTest;
    private TestAdapter testAdapter;
    private List<TestModel> testList, searchList;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_testlist);
        setupDrawer();
        setHeaderTitle("Trắc nghiệm");

        recyclerViewTests = findViewById(R.id.recyclerViewTests);

        testList = new ArrayList<>();
        searchList = new ArrayList<>();
        testAdapter = new TestAdapter(this, searchList, selectedTest -> {
            Intent intent = new Intent(TestListActivity.this, TestOptionActivity.class);
            intent.putExtra("testId", selectedTest.getId());
            intent.putExtra("testTitle", selectedTest.getTitle());
            intent.putExtra("classCode", selectedTest.getClassCode());
            intent.putExtra("testType", selectedTest.getTestType()); // Trắc nghiệm
            intent.putExtra("testDate", selectedTest.getDate());
            intent.putStringArrayListExtra("exCodes", new ArrayList<>(selectedTest.getExCodes()));
            startActivity(intent);
        });
        recyclerViewTests.setLayoutManager(new LinearLayoutManager(this));
        recyclerViewTests.setAdapter(testAdapter);

        // Gọi API với Retrofit
        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl(ApiConfig.BASE_URL)
                .addConverterFactory(GsonConverterFactory.create())
                .build();
        ApiService apiService = retrofit.create(ApiService.class);
        Call<List<TestModel>> call = apiService.getAllExam();
        call.enqueue(new Callback<List<TestModel>>() {
            @Override
            public void onResponse(Call<List<TestModel>> call, Response<List<TestModel>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    testList.clear();
                    //testList.addAll(response.body());
                    SimpleDateFormat inputFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS", Locale.getDefault());
                    SimpleDateFormat outputFormat = new SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault());
                    for(TestModel test: response.body()){
                        String formattedDate = test.getDate(); // Giữ nguyên nếu lỗi
                        try {
                            Date date = inputFormat.parse(test.getDate());
                            if (date != null) {
                                formattedDate = outputFormat.format(date);
                            }
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                        testList.add(new TestModel(
                                test.getId(),
                                test.getTitle(),
                                test.getClassCode(),
                                "Trắc nghiệm",
                                formattedDate,
                                Arrays.asList("001", "002", "003")));
                    }
                    searchList.clear();
                    searchList.addAll(testList);
                    testAdapter.notifyDataSetChanged();

                    Toast.makeText(TestListActivity.this, "Tải dữ liệu thành công!", Toast.LENGTH_SHORT).show();
                } else {
                    Toast.makeText(TestListActivity.this, "Không có dữ liệu hoặc lỗi phản hồi!", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<List<TestModel>> call, Throwable t) {
                Toast.makeText(TestListActivity.this, "Lỗi kết nối API: " + t.getMessage(), Toast.LENGTH_LONG).show();
                t.printStackTrace();
            }
        });
    }
    @Override
    public void onSearchTextChanged(String keyword) {
        searchList.clear();
        if (keyword.isEmpty()) {
            searchList.addAll(testList);
        } else {
            for (TestModel item : testList) {
                if (item.getTitle().toLowerCase().contains(keyword.toLowerCase())) {
                    searchList.add(item);
                }
            }
        }
        testAdapter.notifyDataSetChanged();
    }
}
