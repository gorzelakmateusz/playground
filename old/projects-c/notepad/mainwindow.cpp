#include "mainwindow.h"
#include "ui_mainwindow.h"
#include <QFileDialog> // do wyszukiwania pliku
#include <QTextStream> // do wczytywania pliku
#include <QMessageBox> //

MainWindow::MainWindow(QWidget *parent) :
    QMainWindow(parent),
    ui(new Ui::MainWindow)
{
    ui->setupUi(this);
}

MainWindow::~MainWindow()
{
    delete ui;
}

void MainWindow::on_pb_changeTo_clicked()
{
    ChangeTo(ui->find->text(), ui->changeTo->text());
}

void MainWindow::on_actionOtw_rz_triggered()
{
    OpenFile();
}

void MainWindow::on_actionZapisz_triggered()
{
    SaveFile(previousPath);
}

void MainWindow::on_actionZapisz_jako_triggered()
{
    SaveFile(NULL);
}

void MainWindow::on_actionZamknij_triggered()
{
    qApp->exit();
}

void MainWindow::on_actionPoprawianie_tekstu_triggered()
{
    TextCorrect();
}

void MainWindow::on_textEdit_textChanged()
{
    CharCounter();
}

void MainWindow::on_pb_wordsCounter_clicked()
{
    WordsCounter();
}

void MainWindow::OpenFile()
{
    QString fileName = QFileDialog::getOpenFileName(this, tr("Otwórz..."), "/C:/Users/Piranessi/Desktop/pliki_do_notatnika", tr("pliki txt (*.txt)"));

    QFile file(fileName);

    if(!file.open(QIODevice::ReadOnly | QIODevice::Text)) return;

    text.clear();

    QTextStream stream(&file);

    text = stream.readAll();

    ui->textEdit->setText(text);

    file.close();

    previousPath = fileName;
}

void MainWindow::SaveFile(QString fileName)
{
    text = ui->textEdit->toPlainText();

    if(fileName.isEmpty())
        fileName = QFileDialog::getSaveFileName
                (this, tr("Zapisz jako..."), "/C:/Users/Piranessi/Desktop/pliki_do_notatnika", tr("pliki txt (*.txt)"));

    if(fileName.isEmpty()) return;

    QFile file(fileName);
    file.open(QIODevice::WriteOnly | QIODevice::Truncate | QIODevice::Text);

    QTextStream stream(&file);

    stream << text;

    file.close();

    previousPath = fileName;
}

void MainWindow::ChangeTo(QString seekingText, QString replacement)
{
    text = ui->textEdit->toPlainText();

    if(seekingText.isEmpty() || replacement.isEmpty() || text.isEmpty()) return;

    int i = 0;
    int found = 0;

    while((i = text.indexOf(seekingText, i)) != -1)
    {
        text.replace(i, seekingText.size(), replacement);
        i += replacement.size();
        found++;
    }

    ui->textEdit->setText(text);
    QMessageBox::information(this,tr("Raport"),"Znaleziono "+QString::number(found)+" wyrazów.");
}

void MainWindow::CharCounter()
{
    ui->label_charCounter->setText("Ilość znaków: " + QString::number(ui->textEdit->toPlainText().length()));
}

void MainWindow::WordsCounter()
{
    text = ui->textEdit->toPlainText();
    int found = 0;
    bool addNow = true;

    for(int i = 0; i < text.length() ; i++)
    {
        if(text.at(i) == ' ')
            addNow = true;
        else if(i>=1)
        {
            if(text.at(i-1) == '.' && text.at(i) == '\n')
                addNow = true;
        }

        if((text.at(i) >= 'a' && text.at(i) <= 'z') || (text.at(i) >= 'A' && text.at(i) <= 'Z'))
        {
            if(addNow)
                ++found;
            addNow = false;
        }
    }

    QMessageBox::information(this, tr("Raport"), "Znaleziono " + QString::number(found) + " słów");
}

void MainWindow::TextCorrect()
{
    text = ui->textEdit->toPlainText();

    if (text.at(0) >= 'a' || text.at(0) <= 'z')
        text[0] = text.at(0).toUpper();

    for(int i = 0; i < text.length()-2; i++)
    {
        if(text.at(i) == '.'
          && (text.at(i+1) == ' ' || text.at(i+1) == '\n')
          && (text.at(i+2) >= 'a' && text.at(i+2) <= 'z'))
        {
            text[i+2] = text.at(i+2).toUpper();
        }
    }

    ui->textEdit->setText(text);
}
