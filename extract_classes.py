"""
Python file to extract html (css) classes to identify required Bootstrap content
"""

from bs4 import BeautifulSoup
import pprint


def bs4_classes(content):
    class_list = set()

    # parse html content
    soup = BeautifulSoup(content, 'html.parser')

    # get all tags
    tags = {tag.name for tag in soup.find_all()}

    # iterate all tags
    for tag in tags:

        # find all element of tag
        for i in soup.find_all(tag):

            # if tag has attribute of class
            if i.has_attr("class"):

                if len(i['class']) != 0:
                    class_list.update(i['class'])

    pprint.pprint(class_list)


if __name__ == "__main__":
    file = "rechner_alt.html"
    with open(file, "r") as f:
        html = f.read()

    bs4_classes(html)
