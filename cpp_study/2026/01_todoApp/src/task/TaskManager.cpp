#include "TaskManager.h"


void TaskManager::addTask(const std::string& title) {
	//tasks.push_back(task);
	Task task;
	task.id = nextId++;
	task.title = title;
	task.completed = false;

	tasks.push_back(task);
}


bool TaskManager::completeTask(int id)
{
	for (Task& task  : tasks)
	{
		if (task.id == id) {
			task.completed = true;
			return true;
		}
	}

	return false;
}

const std::vector<Task>& TaskManager::getTasks() const
{
	return tasks;
}

void TaskManager::setTasks(const std::vector<Task>& newTasks)
{
	tasks = newTasks;

	nextId = 1;

	for (const Task& task : tasks)
	{
		if (task.id >= nextId)
		{
			nextId = task.id + 1;
		}
	}
}


