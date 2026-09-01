#include "TaskStorage.h"

#include <fstream>

#include <sstream>

void TaskStorage::save(
	const std::string& filePath,
	const std::vector<Task>& tasks
) const
{
	std::ofstream file(filePath);

	for (const Task&  task : tasks)
	{
		file
			<< task.id << "|"
			<< task.title << "|"
			<< task.completed
			<< std::endl;
	}
}

std::vector<Task> TaskStorage::load
(
	const std::string& filePath
) const
{
	std::vector<Task> tasks;

	std::ifstream file(filePath);

	if (!file.is_open())
	{
		return tasks;
	}

	std::string line;
	while (std::getline(file, line))
	{
		std::stringstream stream(line);

		std::string idText;
		std::string title;
		std::string completedText;


		std::getline(stream, idText, '|');
		std::getline(stream, title, '|');
		std::getline(stream, completedText, '|');


		Task task;

		task.id = std::stoi(idText);
		task.title = title;
		task.completed = std::stoi(completedText) != 0;

		tasks.push_back(task);
	}

	return tasks;
}