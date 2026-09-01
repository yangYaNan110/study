#pragma once

#include <string>
#include <vector>

#include "../task/Task.h"

class TaskStorage
{
public:
	/*把vector<Task> 写进文件*/
	void save(
		const std::string& filePath,
		const std::vector<Task>& task
	) const;

	/*从文件读取， 得到vector<Task>*/
	std::vector<Task> load(
		const std::string& filePath
	) const;

private:

};
