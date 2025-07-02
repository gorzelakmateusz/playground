#include "GameOX.h"
#include <iostream>
#include <string>

void GameOX::Play()
{
	auto position = 0;
	auto moves = 0;
	PrintBoard();

	while(!isGameFinished && moves < 9)
	{
		std::cout << "Now " << MoveFor() << " turns ";

		while (position > 9 || position < 1)
		{
			std::cin >> position;

			if (position > 9 || position < 1)
				std::cout << "Only numbers 1 through 9 are accepted. Try again. ";

			if (fields[position-1] == 'X' || fields[position-1] == 'O')
			{
				std::cout << "This field is already occupied by " << fields[position - 1] << ". Try again. ";
				position = 0;
			}
		}

		Setter(position);
		PrintBoard();

		if (moves > 3)
			isGameFinished = Checker();

		actualPlaying++;
		moves++;
		position = 0;
	}

	if (isGameFinished)
		std::cout << "The winner is: " << winner << std::endl;
	else
		std::cout << "The game ended in a draw." << std::endl;
}

void GameOX::InitialBoardClear()
{
	auto j = '1';
	for (auto i = 0; i < 9; i++)
		fields[i] = j++;
}

void GameOX::PrintBoard()
{
	for (auto i = 0; i < 9; i++)
	{
		std::cout << fields[i] << " ";
		if (i == 2 || i == 5 || i == 8)	std::cout << std::endl;
	}

	std::cout << std::endl;
}

char GameOX::MoveFor() const
{
	if (actualPlaying % 2 == 1)
		return 'X';

	return 'O';
}

void GameOX::Setter(int position)
{
	if (MoveFor() == 'X')
	{
		fields[(position - 1)] = 'X';
	}
	else if (MoveFor() == 'O')
	{
		fields[(position - 1)] = 'O';
	}
	else
		throw new std::exception("Error while setting x/o");
}
bool GameOX::Checker()
{
	auto isGameFinished = false;

	if (fields[0] == 'X' && fields[4] == 'X' && fields[8] == 'X')
	{
		winner = 'X';
		isGameFinished = true;
	}
	else if (fields[2] == 'X' && fields[4] == 'X' && fields[6] == 'X')
	{
		winner = 'X';
		isGameFinished = true;
	}
	else if (fields[0] == 'O' && fields[4] == 'O' && fields[8] == 'O')
	{
		winner = 'O';
		isGameFinished = true;
	}
	else if (fields[2] == 'O' && fields[4] == 'O' && fields[6] == 'O')
	{
		winner = 'O';
		isGameFinished = true;
	}

	for (auto i = 0, j = 0; i < 3 && isGameFinished == false; ++i, j=j+3)
	{
		if (fields[j] == 'X' && fields[j+1] == 'X' && fields[j+2] == 'X')
		{
			winner = 'X';
			isGameFinished = true;
		}
		else if (fields[j] == 'O' && fields[j + 1] == 'O' && fields[j + 2] == 'O')
		{
			winner = 'O';
			isGameFinished = true;
		}
		else if (fields[j] == 'X' && fields[j + 3] == 'X' && fields[j + 6] == 'X')
		{
			winner = 'X';
			isGameFinished = true;
		}
		else if (fields[j] == 'O' && fields[j + 3] == 'O' && fields[j + 6] == 'O')
		{
			winner = 'O';
			isGameFinished = true;
		}
	}

	return isGameFinished;
}

GameOX::GameOX()
{
	actualPlaying = 1;
	isGameFinished = false;
	InitialBoardClear();
}

GameOX::~GameOX()
{
	std::cout << std::endl << std::endl << "Thanks for playing :)" << std::endl;
}
