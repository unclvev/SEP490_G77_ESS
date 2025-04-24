package com.example.essgrading.Fragment;

import android.os.Bundle;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import com.example.essgrading.Adapter.StudentAdapter;
import com.example.essgrading.Model.StudentModel;
import com.example.essgrading.R;
import java.util.ArrayList;
import java.util.List;

public class ClassStudentsFragment extends Fragment {

    private String classCode;
    private RecyclerView recyclerView;
    private StudentAdapter studentAdapter;
    private List<StudentModel> studentList;

    public static ClassStudentsFragment newInstance(String classCode) {
        ClassStudentsFragment fragment = new ClassStudentsFragment();
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
        }
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_class_students, container, false);
        recyclerView = view.findViewById(R.id.recyclerViewStudents);
        recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));

        // Dữ liệu giả lập
        studentList = new ArrayList<>();
        studentList.add(new StudentModel("Hoàng Thu Phương", "HE172276"));
        studentList.add(new StudentModel("Phòng Hoàng Lam", "HE170159"));
        studentAdapter = new StudentAdapter(studentList);
        recyclerView.setAdapter(studentAdapter);

        return view;
    }
}
