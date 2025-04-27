package com.example.essgrading.Fragment;

import android.content.Intent;
import android.os.Bundle;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import com.example.essgrading.Activity.Test.SelectExCodeActivity;
import com.example.essgrading.Adapter.TestAdapter;
import com.example.essgrading.Model.TestModel;
import com.example.essgrading.R;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class ClassTestsFragment extends Fragment {

    private String id, classCode;
    private RecyclerView recyclerView;
    private TestAdapter testAdapter;
    private List<TestModel> testList;

    public static ClassTestsFragment newInstance(String classCode) {
        ClassTestsFragment fragment = new ClassTestsFragment();
        Bundle args = new Bundle();
        args.putString("classCode", classCode);
        fragment.setArguments(args);
        return fragment;
    }

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getArguments() != null) {
            classCode = getArguments().getString("classCode");
            id = getArguments().getString("id");
        }
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_class_tests, container, false);
        recyclerView = view.findViewById(R.id.recyclerViewTests);
        recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));

        // Dữ liệu giả lập
        List<String> exCodes = Arrays.asList("001", "002", "003");
        testList = new ArrayList<>();
        testList.add(new TestModel(id, "Toán khối 2", classCode, "Trắc nghiệm", "05/02/2025", exCodes));

        testAdapter = new TestAdapter(getContext(), testList, selectedTest -> {
            // Chuyển sang SelectExCodeActivity khi chọn bài kiểm tra
            Intent intent = new Intent(getContext(), SelectExCodeActivity.class);
            intent.putExtra("testTitle", selectedTest.getTitle());
            intent.putExtra("classCode", selectedTest.getClassCode());
            intent.putStringArrayListExtra("exCodes", new ArrayList<>(selectedTest.getExCodes()));
            startActivity(intent);
        });

        recyclerView.setAdapter(testAdapter);

        return view;
    }
}
