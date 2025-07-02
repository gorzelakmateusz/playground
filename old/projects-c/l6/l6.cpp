#include "stdafx.h"
#include <stdlib.h>
#include <iostream>
#include <algorithm>
#include <windows.h>
#include <fstream>
#include <string>
#include <iomanip>

void ShowElementsInArray(const double * arrayPointer, const int size)
{
	for (auto i = 0 ; i < size ; i++)
		std::cout << "Element nr " << (i + 1) << "/" << size << ": " << arrayPointer[i] << std::endl;
}

double Median(double * arrayPointer, int size)
{
	std::sort(arrayPointer, arrayPointer + size);
	double median = 0;

	if (size % 2 == 1)
		return(arrayPointer[((size - 1) / 2)]);

	return(((arrayPointer[(size - 1) / 2] + arrayPointer[size / 2]) / 2));
}

double AverageOfTheArray(const double * arrayPointer, const int size)
{
	auto sum = 0;

	for (auto i = 0; i < size; i++)
	{
		sum += arrayPointer[i];
	}

	return (sum / size);
}

double TheBiggestNumberSearch(const double * arrayPointer, const int size)
{
	auto result = arrayPointer[0];

	for (auto i = 1; i < size; i++)
	{
		if (result < arrayPointer[i])
			result = arrayPointer[i];
	}

	return result;
}

double TheSmallestNumberSearch(const double * arrayPointer, const int size)
{
	auto result = arrayPointer[0];

	for (auto i = 1; i < size; i++)
	{
		if (result > arrayPointer[i])
			result = arrayPointer[i];
	}

	return result;
}

double StdDeviation(const double * arrayPointer, const int size)
{
	auto sumOfSquares = 0;
	auto arithmeticAverage = AverageOfTheArray(arrayPointer, size);

	for (auto i = 0; i < size; i++)
	{
		sumOfSquares += pow((arrayPointer[i] - arithmeticAverage), 2);
	}

	return sqrt(sumOfSquares / size);
}

double * MakeArray(const int size)
{
	auto * arrayPointer = new double[size];

	for (auto i = 0; i < size; i++)
	{
		std::cout << "Podaj argument nr " << (i + 1) << "/" << size << ": ";
		std::cin >> arrayPointer[i];
	}

	return arrayPointer;
}

double * SumOfArrays(const double * arrayPointer, const double * arrayPointer2, const int size, const int size2)
{
	int biggerSize;

	if (size > size2)
		biggerSize = size;
	else
		biggerSize = size2;

	auto *resultArray = new double[biggerSize];

	for(auto i = 0 ; i < biggerSize ; i++)
	{
		resultArray[i] = 0;

		if (size > i)
			resultArray[i] += arrayPointer[i];

		if (size2 > i)
			resultArray[i] += arrayPointer2[i];
	}

	return resultArray;
}

void ArrayOperations()
{
	try
	{
		double(*(arrayOfPointersForAO[5]))(const double * arrayPointer, const int size) = 
		{
			TheSmallestNumberSearch,
			TheBiggestNumberSearch,
			AverageOfTheArray 
		};

		int size, size2;

		std::cout << "Podaj rozmiar pierwszej oraz drugiej tablicy: ";
		std::cin >> size >> size2;

		auto * whateverArray = MakeArray(size);
		auto * whateverArraySecond = MakeArray(size2);
		auto * sumOfTwoArrays = SumOfArrays(whateverArray, whateverArraySecond, size, size2);

		std::cout << std::endl << std::setw(50) << std::left << "Srednia elementow z tablicy - " << std::setw(20) << std::right << arrayOfPointersForAO[2](whateverArray, size)
			<< std::endl << std::setw(50) << std::left << "Najwiekszy element z tablicy - " << std::setw(20) << std::right << arrayOfPointersForAO[1](whateverArray, size)
			<< std::endl << std::setw(50) << std::left << "Najmniejszy element z tablicy  - " << std::setw(20) << std::right << arrayOfPointersForAO[0](whateverArray, size)
			<< std::endl << std::setw(50) << std::left << "Mediana - " << std::setw(20) << std::right << Median(whateverArray, size)
			<< std::endl << std::setw(50) << std::left << "Odchylenie standardowe z pierwszej tablicy - " << std::setw(20) << std::right << StdDeviation(whateverArray, size)
			<< std::endl << std::setw(50) << std::left << "Zsumowane dwie tablice - "
			<< std::endl;

		for (auto i = 0; i < size2; i++)
		{
			std::cout << sumOfTwoArrays[i] << " ";
		}

		std::cout << std::endl << std::endl;

		delete[] whateverArray;
		delete[] whateverArraySecond;
		delete[] sumOfTwoArrays;
	}
	catch (std::bad_alloc)
	{
		SetConsoleTextAttribute(GetStdHandle(STD_OUTPUT_HANDLE), 0xC4);
		std::cout << std::endl << std::endl << "nieudana rezerwacja pamieci" << std::endl;
	}
}

int main()
{
	ArrayOperations();

    return 0;
}
