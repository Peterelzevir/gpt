class TelegramMultiAccountInviteTool:
    def __init__(self):
        print("Tool initialized!")

    def main_menu(self):
        print("Main menu called!")
        while True:
            choice = input("1. Say Hello\n2. Exit\nChoose: ")
            if choice == '1':
                print("Hello!")
            elif choice == '2':
                print("Exiting...")
                break
            else:
                print("Invalid choice.")

def main():
    tool = TelegramMultiAccountInviteTool()
    tool.main_menu()

if __name__ == "__main__":
    main()
