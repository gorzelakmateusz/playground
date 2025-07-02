#include "CRUD.h"
#include <iostream>
#include <conio.h>
#include <stdlib.h>

CRUD::CRUD(std::string databaseName)
{
	this->databaseName = databaseName;
	ReadAll();
	std::cout << "Size of Database = " << this->database.size() << std::endl << std::endl;
}

CRUD::~CRUD()
{
	Save();
	system("cls");
	std::cout << std::endl
		<< "-----------------" << std::endl
		<< "| Changes saved |" << std::endl
		<< "-----------------" << std::endl;
}

void CRUD::ReadAll()
{
	Contacts contact;
	std::string tmp;
	if (!this->database.empty()) { this->database.clear(); }
	this->file.open(this->databaseName, std::ios::in);
	if (!file.good()) throw new std::exception("Read() - can't open file.");
	for (auto i = 0, checker = 1; !file.eof(); ++i, ++checker)
	{
		if (checker % 4 == 1)
		{
			getline(file, tmp);
			contact.id = atoi(tmp.c_str());
		}
		else if (checker % 4 == 2) { getline(file, contact.name); }
		else if (checker % 4 == 3) { getline(file, contact.surname); }
		else if (checker % 4 == 0)
		{
			getline(file, contact.phoneNumber);
			this->database.push_back(contact);
		}
	}
	this->file.close();
}

void CRUD::Create()
{
	Contacts contact;
	std::cout << std::endl
		<< "----------" << std::endl
		<< "| CREATE |" << std::endl
		<< "----------" << std::endl << std::endl
		<< "Name: ";
	std::getline(std::cin, contact.name);
	std::cout << "Surname: ";
	std::getline(std::cin, contact.surname);
	std::cout << "Phone number: ";
	std::getline(std::cin, contact.phoneNumber);
	if (this->database.size() != 0)
	{
		contact.id = database.at(database.size() - 1).id + 1;
	}
	else { contact.id = 1; }
	this->database.push_back(contact);
}

void CRUD::Read(int index)
{
	std::cout << std::endl
		<< "ID: " << this->database.at(index).id << std::endl
		<< "Name: " << this->database.at(index).name << std::endl
		<< "Surname: " << this->database.at(index).surname << std::endl
		<< "Phone number: " << this->database.at(index).phoneNumber << std::endl;
}

void CRUD::Update(int index)
{
	std::cout << std::endl
		<< "----------" << std::endl
		<< "| UPDATE |" << std::endl
		<< "----------" << std::endl << std::endl
		<< "Name: ";
	std::getline(std::cin, this->database.at(index).name);
	std::cout << "Surname: ";
	std::getline(std::cin, this->database.at(index).surname);
	std::cout << "Phone number: ";
	std::getline(std::cin, this->database.at(index).phoneNumber);
}

void CRUD::Delete(int index)
{
	char ch;
	std::cout << std::endl
		<< "----------" << std::endl
		<< "| REMOVE |" << std::endl
		<< "----------" << std::endl << std::endl
		<< "Are you sure that you want delete that user from database? y / Anything else: " << std::endl;
	if ((ch = getch()) == 'y')
	{
		this->database.at(index).name = "";
		this->database.at(index).surname = "";
		this->database.at(index).phoneNumber = "";
		this->database.at(index).id = 0;
		std::cout << "Person data deleted." << std::endl;
	}
	else { std::cout << "Action cancelled." << std::endl; }
	_sleep(1500);
}

void CRUD::Save()
{
	this->file.open(this->databaseName, std::ios::out);
	if (!file.good()) throw new std::exception("Save() - can't open file.");
	for (auto i = 0; i < database.size() ; ++i)
	{
		if (i != database.size()-1)
		{
			if (!database.at(i).name.empty() && !database.at(i).surname.empty()
				&& !database.at(i).phoneNumber.empty())
			{
				this->file
					<< database.at(i).id << std::endl
					<< database.at(i).name << std::endl
					<< database.at(i).surname << std::endl
					<< database.at(i).phoneNumber << std::endl;
			}
		}
		else
		{
			if (!database.at(i).name.empty() && !database.at(i).surname.empty()
				&& !database.at(i).phoneNumber.empty())
			{
				this->file
					<< database.at(i).id << std::endl
					<< database.at(i).name << std::endl
					<< database.at(i).surname << std::endl
					<< database.at(i).phoneNumber;
			}
		}
	}
	this->file.close();
}

void CRUD::Refresh(int & i)
{
	if (i == this->database.size() - 1) --i;
	Save();
	ReadAll();
}

void CRUD::Menu()
{
	auto ch = 'W';
	auto i = 0;
	while( ch == 'W' || ch == 'w' || ch == 'E' || ch == 'e' ||
		ch == 'U' || ch == 'u' || ch == 'R' || ch == 'r' ||
		ch == 'D' || ch == 'd' || ch == 'C' || ch == 'c' )
	{
		system("cls");
		std::cout << std::endl
			<< "------------------------------------------------------" << std::endl
			<< "| W - go left | E - go right | anything else - quit  |" << std::endl
			<< "------------------------------------------------------" << std::endl
			<< "| U - update | D - delete | R - refresh | C - create |" << std::endl
			<< "------------------------------------------------------" << std::endl
			<< "| Row " << i+1 << "/" << this->database.size() << std::endl
			<< "------------------------------------------------------" << std::endl << std::endl;
		Read(i);
		ch = getch();
		if ( ch == 'W' || ch == 'w')
		{
			if (i > 0) { --i; }
			else { i = this->database.size() - 1; }
		}
		else if ( ch == 'E' || ch == 'e')
		{
			if (i < this->database.size() - 1) { ++i; }
			else { i = 0; }
		}
		else if (ch == 'U' || ch == 'u') { Update(i); }
		else if (ch == 'D' || ch == 'd') { Delete(i); Refresh(i); }
		else if (ch == 'R' || ch == 'r') { Refresh(i); }
		else if (ch == 'C' || ch == 'c') { Create(); Refresh(i); }
	}
}