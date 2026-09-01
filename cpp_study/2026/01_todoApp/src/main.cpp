#include <iostream>
#include "task/Task.h"
#include "task/TaskManager.h"
#include "utils/Utils.h"
#include "storage/TaskStorage.h"


using namespace std;
int main()
{
	TaskManager manager;
	TaskStorage storage;

	const std::string filePath = "tasks.txt";
	std::vector<Task> loadedTasks = storage.load(filePath);
	manager.setTasks(loadedTasks);
	while (true)
	{
		cout << endl;
		cout << "==== Todo App ====" << endl;
		cout << "1.  Add task" << endl;
		cout << "2. List tasks" << endl;
		cout << "3. Complete task" << endl;
		cout << "4. Exit" << endl;
		cout << "Please select: ";

		int choice = readInt();
		if (choice == 1)
		{
			cout << "Task title:  ";
			std::string title =trim(readLine());
			if (title.empty())
			{
				std::cout << "Task title cannot be empty." << endl;
				continue;
			}
			manager.addTask(title);
			cout << "Task added." << endl;
		}
		else if (choice == 2)
		{
			//列出所有任务
			const std::vector<Task>& tasks = manager.getTasks();
			for (const Task& task : tasks)
			{
				task.print();
			}
		}
		else if (choice == 3)
		{
			//完成指定任务
			cout << "Task id:  ";
			int id = readInt();
			bool success = manager.completeTask(id);
			if (success)
			{
				cout << "Task comoleted. " << endl;
			}
			else
			{
				cout << "Task not found.  " << endl;
			}
		}
		else if (choice == 4)
		{
			//退出应用
			storage.save(
				filePath,
				manager.getTasks()
			);
			break;
		}
		else
		{
			//错误输入
			cout << "输入有误. " << endl;
		}

	}

	return 0;
}
