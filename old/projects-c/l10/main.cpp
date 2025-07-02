#pragma once
#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#define RLIMIT 9

//
// Files in directory "test" must be numbered according to the formula: 0, 1, 2, 3, ..., n.
// In first line put row size (integer), in second line put column size (integer).
// From 3 line setup map.
// Pattern:
//
// 2
// 3
// .#.
// .#.
// ...
//
// Where '#' is wall, '.' is ground (possible to pass)
//

struct Cell
{
	Cell * right_Cell, *left_Cell, *up_Cell, *down_Cell;
	bool value;
	int distance;
};

bool CanGo(Cell * cell, std::vector<Cell *> vek);

std::string LoadContentString(std::fstream * file, int cSize);

std::string ContentConverter(std::fstream * file, int cSize, char ch);

void PrintDistances(Cell * arr, int rSize, int cSize);

void PrintMap(Cell * arr, int rSize, int cSize, char ch);

void SetPathLength(Cell * arr, int i, int invokeLimit);

void SetConnections(Cell * arr, int rSize, int cSize);

void InitialValueAndDistance(Cell * arr, int rSize, int cSize);

void SetupArrOfStructs(Cell * arr, int rSize, int cSize, int * wallCount, std::fstream * file, char ch);

void GetMatrixSizes(int * rSize, int * cSize, std::fstream * file);

void CreateConnection(Cell * cell, int i, bool up, bool down, bool left, bool right, int a, int b, int c, int d);

void Go(Cell * cell, Cell * target, std::vector<Cell*> vek, int result,
	bool isFinished, int invokeCounter, int invokeLimit, int resultLimit, int * resultCounter);

int main()
{
	const char CHAR = '.';
	std::fstream file;
	std::string tmp = "error message"; // this "error message" can be helpful to find errors
	bool fileGood = true;
	int rSize = 0, cSize = 0;
	for (int i = 0; fileGood; ++i)
	{
		file.open("../test/" + std::to_string(i) + ".txt", std::ios::in);
		if (file.good())
		{
			int wallCount = 0;
			std::cout << "FILE: " << i << ".txt" << std::endl;
			GetMatrixSizes(&rSize, &cSize, &file);
			auto * arrayOfCells = new Cell[rSize * cSize];
			SetupArrOfStructs(arrayOfCells, rSize, cSize, &wallCount, &file, CHAR);
			PrintMap(arrayOfCells, rSize, cSize, CHAR);
			SetConnections(arrayOfCells, rSize, cSize);
			for (int j = 0; j < rSize*cSize; ++j)
			{
				SetPathLength(arrayOfCells, j, rSize + cSize + wallCount);
			}
			PrintDistances(arrayOfCells, rSize, cSize);
			std::cout << std::endl << std::endl;
			// end work with file & delete array
			delete[] arrayOfCells;
			file.close();
		}
		else { fileGood = false; }
	}
	return 0;
}

void CreateConnection(Cell * cell, int i, bool up, bool down, bool left, bool right, int a, int b, int c, int d)
{
	cell[i].up_Cell = up ? &cell[a] : NULL;
	cell[i].down_Cell = down ? &cell[b] : NULL;
	cell[i].left_Cell = left ? &cell[c] : NULL;
	cell[i].right_Cell = right ? &cell[d] : NULL;
}

bool CanGo(Cell * cell, std::vector<Cell*> vek)
{
	if (cell == NULL || cell->value == false) { return false; }
	for (int i = 0; i < vek.size(); ++i){ if (cell == vek.at(i)) { return false; } }
	return true;
}

void Go(Cell * cell, Cell * target, std::vector<Cell*> vek, int result, bool isFinished, int invokeCounter, int invokeLimit, int resultLimit, int * resultCounter)
{
	if (invokeCounter > invokeLimit) { return; }
	++invokeCounter;
	if (target->distance > 0 && target->distance < result && *resultCounter > resultLimit) { return; }
	vek.push_back(cell);
	if (cell == target)
	{
		++*resultCounter;
		isFinished = true;
		if (target->distance <= 0) { target->distance = result; }
		else { target->distance = target->distance > result ? result : target->distance; }
	}
	if (isFinished == false)
	{
		++result;
		if (CanGo(cell->right_Cell, vek))
		{ Go(cell->right_Cell, target, vek, result, isFinished, invokeCounter, invokeLimit, resultLimit, resultCounter); }
		if (CanGo(cell->down_Cell, vek))
		{ Go(cell->down_Cell, target, vek, result, isFinished, invokeCounter, invokeLimit, resultLimit, resultCounter); }
		if (CanGo(cell->left_Cell, vek))
		{ Go(cell->left_Cell, target, vek, result, isFinished, invokeCounter, invokeLimit, resultLimit, resultCounter); }
		if (CanGo(cell->up_Cell, vek)) { Go(cell->up_Cell, target, vek, result, isFinished, invokeCounter, invokeLimit, resultLimit, resultCounter); }
	}
}

void PrintDistances(Cell * arr, int rSize, int cSize)
{
	std::cout << std::endl << "Distances";
	for (int i = 0; i < rSize * cSize; ++i)
	{
		if (i % cSize == 0) { std::cout << std::endl; }
		if (arr[i].value == true)
		{
			if (arr[i].distance < 0) { std::cout << "0 "; }
			else { std::cout << arr[i].distance % 10 << " "; }
		}
		else { std::cout << "# "; }
	}
}

void PrintMap(Cell * arr, int rSize, int cSize, char ch)
{
	std::cout << std::endl << "Map:";
	for (int j = 0; j < rSize * cSize; ++j)
	{
		if (j % cSize == 0) { std::cout << std::endl; }
		std::cout << (arr[j].value == true ? ch : '#') << " ";
	}
}

void SetPathLength(Cell * arr, int i, int invokeLimit)
{
	int resultCounter = 0;
	bool isFinished = false;
	std::vector<Cell *> tmpV;
	Go(arr, &arr[i], tmpV, 0, isFinished, 0, invokeLimit, RLIMIT, &resultCounter);
}

void SetConnections(Cell * arr, int rSize, int cSize)
{
	for (int i = 0; i < (rSize * cSize); ++i)
	{
		if (arr[i].value == true)
		{
			if (i == 0) // top-left corner
			{ CreateConnection(arr, i, false, true, false, true, NULL, cSize, NULL, 1); }
			else if (i == cSize - 1) // top-right corner
			{ CreateConnection(arr, i, false, true, true, false, NULL, i + cSize, i - 1, NULL); }
			else if (i == cSize * (rSize - 1)) // bottom-left corner
			{ CreateConnection(arr, i, true, false, false, true, i - cSize, NULL, NULL, i + 1); }
			else if (i == rSize * cSize - 1) // bottom-right corner
			{ CreateConnection(arr, i, true, false, true, false, i - cSize, NULL, i - 1, NULL); }
			else if (i > 0 && i < cSize - 1) // top (except left & right corners)
			{ CreateConnection(arr, i, false, true, true, true, NULL, i + cSize, i - 1, i + 1); }
			else if (i > cSize * (rSize - 1) && i < rSize * cSize - 1) // bottom (except left & right corners)
			{ CreateConnection(arr, i, true, false, true, true, i - cSize, NULL, i - 1, i + 1); }
			else if (i > 0 && i < cSize * (rSize - 1) && i % cSize == 0) // left (except top & bottom corners)
			{ CreateConnection(arr, i, true, true, false, true, i - cSize, i + cSize, NULL, i + 1); }
			else if (i >(cSize - 1) && i < (cSize * rSize - 1) && ((i + 1) % cSize) == 0) // right (except top & bottom corners)
			{ CreateConnection(arr, i, true, true, true, false, i - cSize, i + cSize, i - 1, NULL); }
			else
			{ CreateConnection(arr, i, true, true, true, true, i - cSize, i + cSize, i - 1, i + 1); }
		}
	}
}

std::string LoadContentString(std::fstream * file, int cSize)
{
	std::string tmp, result;
	while (!file->eof())
	{
		getline(*file, tmp);
		if (tmp.length() > cSize) { throw new std::exception("Array is to small for provided data."); }
		result += tmp;
	}
	return result;
}

std::string ContentConverter(std::fstream * file, int cSize, char ch)
{
	std::string result = LoadContentString(file, cSize);
	for (int j = 0; j < result.length(); ++j)
	{
		if (result.at(j) == ch) { result.at(j) = '1'; }
		else { result.at(j) = '0'; }
	}
	return result;
}

void InitialValueAndDistance(Cell * arr, int rSize, int cSize)
{
	for (int j = 0; j < rSize * cSize; ++j)
	{
		arr->value = NULL;
		arr->distance = 0;
	}
}

void SetupArrOfStructs(Cell * arr, int rSize, int cSize, int * wallCount, std::fstream * file, char ch)
{
	InitialValueAndDistance(arr, rSize, cSize);
	std::string content = ContentConverter(file, cSize, ch);;
	for (int j = 0; j < (rSize * cSize); ++j)
	{
		if (content.at(j) == '1') { arr[j].value = true; }
		else
		{
			arr[j].value = false;
			++*wallCount;
		}
	}
}

void GetMatrixSizes(int * rSize, int * cSize, std::fstream * file)
{
	std::string tmp;
	std::getline(*file, tmp);
	*rSize = atoi(tmp.c_str());
	getline(*file, tmp);
	*cSize = atoi(tmp.c_str());
}
