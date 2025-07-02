#include "mainwindow.h"
#include "ui_mainwindow.h"

MainWindow::MainWindow(QWidget *parent) :
    QMainWindow(parent),
    ui(new Ui::MainWindow)
{
    sceneObj = new GameScene(ui->moveInfo);
    ui->setupUi(this);
    ui->scene->setScene(sceneObj);
}

MainWindow::~MainWindow()
{
    delete ui;
}
