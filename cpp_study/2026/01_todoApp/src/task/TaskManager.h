#pragma once
#include <vector>
#include "Task.h"

class TaskManager {

public:
	//void addTask(const Task& task);
	void addTask(const std::string& title);

	/*根据任务 id 找到任务，并把：completed = false 改为 completed = true;*/
	bool completeTask(int id);


	const std::vector<Task>& getTasks() const;

	void setTasks(const std::vector<Task>& newTasks);

private:
	std::vector<Task> tasks;
	int nextId = 1;

};