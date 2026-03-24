#include <iostream>
#include <string>
#include <vector>
#include <nlohmann/json.hpp>
#include <cmath>

using json = nlohmann::json;

// 计算数组的和
double calculateSum(const std::vector<double> &arr)
{
    double sum = 0;
    for (double num : arr)
    {
        sum += num;
    }
    return sum;
}

// 计算数组的平均值
double calculateAverage(const std::vector<double> &arr)
{
    if (arr.empty())
        return 0;
    return calculateSum(arr) / arr.size();
}

// 计算标准差
double calculateStdDev(const std::vector<double> &arr)
{
    if (arr.empty())
        return 0;
    double avg = calculateAverage(arr);
    double sumSquareDiff = 0;
    for (double num : arr)
    {
        sumSquareDiff += (num - avg) * (num - avg);
    }
    return std::sqrt(sumSquareDiff / arr.size());
}

int main()
{
    // 设置 JSON 输入/输出缓冲
    std::string line;

    while (std::getline(std::cin, line))
    {
        if (line.empty())
            continue;

        try
        {
            // 解析 JSON 输入
            json input = json::parse(line);
            json output;

            int requestId = input.value("requestId", -1);
            std::string operation = input.value("operation", "");
            std::vector<double> data = input.value("data", std::vector<double>());

            output["requestId"] = requestId; // 回显 requestId

            if (operation == "sum")
            {
                output["result"] = calculateSum(data);
                output["status"] = "success";
            }
            else if (operation == "average")
            {
                output["result"] = calculateAverage(data);
                output["status"] = "success";
            }
            else if (operation == "stddev")
            {
                output["result"] = calculateStdDev(data);
                output["status"] = "success";
            }
            else if (operation == "stats")
            {
                output["sum"] = calculateSum(data);
                output["average"] = calculateAverage(data);
                output["stddev"] = calculateStdDev(data);
                output["count"] = data.size();
                output["status"] = "success";
            }
            else
            {
                output["error"] = "Unknown operation: " + operation;
                output["status"] = "error";
            }

            // 输出 JSON 结果
            std::cout << output.dump() << std::endl;
        }
        catch (const std::exception &e)
        {
            json error;
            error["error"] = e.what();
            error["status"] = "error";
            std::cout << error.dump() << std::endl;
        }
    }

    return 0;
}
