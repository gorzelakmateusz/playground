#pragma once
class GameOX
{
	char winner;
	char fields[9];
	bool isGameFinished;
	int actualPlaying;

	void InitialBoardClear();
	void PrintBoard();
	bool Checker();
	char MoveFor() const;
	void Setter(int position);

public:
	void Play();

	GameOX();
	~GameOX();
};

