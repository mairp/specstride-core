def greet(name):
    """Return the greeting the launcher prints."""
    return "hello, %s" % name


def main():
    print(greet("world"))


if __name__ == "__main__":
    main()
