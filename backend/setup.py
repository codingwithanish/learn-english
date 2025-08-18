from setuptools import setup, find_packages

setup(
    name="learn-english-backend",
    version="1.0.0",
    packages=find_packages(include=['app', 'app.*']),
    package_dir={'': '.'},
    python_requires=">=3.12",
    install_requires=[
        # Dependencies will be read from requirements.txt
    ],
)