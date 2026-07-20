import { invoke } from '@tauri-apps/api/core';

export interface Course {
  id: string;
  name: string;
  instructor: string;
  schedule: string;
  location: string;
  color: string;
}

export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  due_date: string;
  type: 'homework' | 'exam' | 'project';
  done: boolean;
}

export const courseService = {
  listCourses(): Promise<Course[]> {
    return invoke('list_courses');
  },
  createCourse(course: Course): Promise<void> {
    return invoke('create_course', { course });
  },
  deleteCourse(id: string): Promise<void> {
    return invoke('delete_course', { id });
  },
  listAssignments(): Promise<Assignment[]> {
    return invoke('list_assignments');
  },
  createAssignment(assignment: Assignment): Promise<void> {
    return invoke('create_assignment', { assignment });
  },
  updateAssignment(assignment: Assignment): Promise<void> {
    return invoke('update_assignment', { assignment });
  },
  deleteAssignment(id: string): Promise<void> {
    return invoke('delete_assignment', { id });
  },
};
