package com.example.essgrading.Adapter;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentActivity;
import androidx.viewpager2.adapter.FragmentStateAdapter;
import com.example.essgrading.Fragment.ClassTestsFragment;
import com.example.essgrading.Fragment.ClassStudentsFragment;

public class ClassDetailPagerAdapter extends FragmentStateAdapter {

    private String classCode;

    public ClassDetailPagerAdapter(@NonNull FragmentActivity fragmentActivity, String classCode) {
        super(fragmentActivity);
        this.classCode = classCode;
    }

    @NonNull
    @Override
    public Fragment createFragment(int position) {
        if (position == 0) {
            return ClassTestsFragment.newInstance(classCode);
        } else {
            return ClassStudentsFragment.newInstance(classCode);
        }
    }

    @Override
    public int getItemCount() {
        return 2;
    }
}
