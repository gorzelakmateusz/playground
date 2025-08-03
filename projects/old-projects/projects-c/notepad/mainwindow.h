#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>

namespace Ui {
class MainWindow;
}

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    explicit MainWindow(QWidget *parent = 0);
    ~MainWindow();

    QString previousPath;
    QString text;
//    QString seekingText;
//    QString replacement;

    void OpenFile();
    void SaveFile(QString fileName);
    void ChangeTo(QString seekingText, QString replacement);
    void CharCounter();
    void WordsCounter();
    void TextCorrect();

private slots:
    void on_pb_changeTo_clicked();
    void on_actionOtw_rz_triggered();
    void on_actionZapisz_triggered();
    void on_actionZapisz_jako_triggered();
    void on_actionZamknij_triggered();
    void on_actionPoprawianie_tekstu_triggered();

    void on_textEdit_textChanged();

    void on_pb_wordsCounter_clicked();

private:
    Ui::MainWindow *ui;
};

#endif // MAINWINDOW_H

//TODO: replace && find
