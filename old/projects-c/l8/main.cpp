#include <iostream>
#include <fstream>
#include <time.h>
#include <string>
#define NUMBERS_AMOUNT 11
#define NUMBERS_AMOUNT_IN_FILE 100

void NumberCounter(int size, int * result, std::string * files)
{
	std::string tmp;
	std::fstream file;

	for (auto i = 0; i < size * NUMBERS_AMOUNT; ++i)
		result[i] = 0;

	for (auto i = 0; i < size; ++i)
	{
		file.open(files[i], std::ios::in);

		if (!file.good())
			throw new std::exception("Error while opening file");

		while (!file.eof())
		{
			std::getline(file, tmp);
			for (auto j = 0; j < NUMBERS_AMOUNT; ++j)
				if (atoi(tmp.c_str()) == j) result[i * NUMBERS_AMOUNT + j]++;
		}

		file.close();
	}
}

void MaxResult(std::string * files, int * resultMax, int size)
{
	std::fstream file;
	std::string tmp;
	int arrayTmp[NUMBERS_AMOUNT_IN_FILE];

	for (auto i = 0; i < size * NUMBERS_AMOUNT; ++i)
		resultMax[i] = 0;

	for (auto i = 0; i < size; ++i)
	{
		auto isFirst = true;
		auto counter = 0;

		file.open(files[i], std::ios::in);

		for (auto j = 0; j < NUMBERS_AMOUNT_IN_FILE; ++j)
		{
			std::getline(file, tmp);
			arrayTmp[j] = atoi(tmp.c_str());
		}

		for (auto j = 0; j < (NUMBERS_AMOUNT_IN_FILE - 1); ++j)
		{
			if (arrayTmp[j] == arrayTmp[j + 1])
			{
				if (isFirst)
				{
					counter = 2;
					isFirst = false;
				}
				else counter++;
			}
			else
			{
				isFirst = true;

				if (resultMax[i * NUMBERS_AMOUNT + arrayTmp[j]] == 0) resultMax[i * NUMBERS_AMOUNT + arrayTmp[j]] = 1;
				else if (resultMax[i * NUMBERS_AMOUNT + arrayTmp[j]] < counter)
				{
					resultMax[i * NUMBERS_AMOUNT + arrayTmp[j]] = counter;
					counter = 0;
				}
			}

			if (arrayTmp[98] == arrayTmp[(NUMBERS_AMOUNT_IN_FILE - 1)] && resultMax[i * NUMBERS_AMOUNT + arrayTmp[(NUMBERS_AMOUNT_IN_FILE - 1)] < counter])
				resultMax[i * NUMBERS_AMOUNT + arrayTmp[(NUMBERS_AMOUNT_IN_FILE - 1)]] = counter;

			if (resultMax[i * NUMBERS_AMOUNT + arrayTmp[(NUMBERS_AMOUNT_IN_FILE - 1)]] == 0)
				resultMax[i * NUMBERS_AMOUNT + arrayTmp[(NUMBERS_AMOUNT_IN_FILE - 1)]] = 1;
		}

		file.close();
	}
}

void FilesWrite(std::string * files, const int size)
{
	srand(time(NULL));
	std::fstream file;

	for (auto i = 0; i < size; ++i)
	{
		files[i] = "plik_" + std::to_string(i + 1) + ".txt";

		file.open(files[i], std::ios::out);
		if (!file.good())
			throw new std::exception("B³¹d podczas otwierania pliku");

		for (auto j = 0; j < (NUMBERS_AMOUNT_IN_FILE - 1); ++j)
			file << (0 + (rand() % NUMBERS_AMOUNT)) << std::endl;

		file << (0 + (rand() % NUMBERS_AMOUNT));
		file.close();
	}
}

void MakeResult(std::string * files, int *result, int * resultMax, const int size)
{
	std::fstream file;

	file.open("Results.txt", std::ios::out);
	if (!file.good())
		throw new std::exception("Error while opening file");

	for (auto i = 0; i < size; ++i)
	{
		file << "Wyniki z " << files[i] << std::endl;
		for (auto j = 0; j < NUMBERS_AMOUNT; j++)
		{
			file << "Dla " << j << " - iloœæ wyst¹pieñ: " << result[i * NUMBERS_AMOUNT + j]
				<< " # max wyst¹pieñ z rzêdu: " << resultMax[i * NUMBERS_AMOUNT + j]
				<< std::endl;
		}
		file << std::endl;
	}
	file.close();
}

int main()
{
	auto size = 10; // defines how many files should be created
	auto * files = new std::string[size];
	auto * result = new int[size * NUMBERS_AMOUNT];
	auto * resultMax = new int[size * NUMBERS_AMOUNT];

	FilesWrite(files, size);
	NumberCounter(size, result, files);
	MaxResult(files, resultMax, size);
	MakeResult(files, result, resultMax, size);

	delete[] files, result, resultMax;
	return 0;
}
