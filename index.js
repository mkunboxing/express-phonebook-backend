const express = require('express');
const fs = require('fs/promises');

const app = express();
const port = 8000;

app.use(express.json());

const contactsFilePath = 'contacts.json';

let contacts = [];

// Load contacts from the JSON file on server startup
(async () => {
    try {
        const data = await fs.readFile(contactsFilePath, 'utf-8');
        contacts = JSON.parse(data);
    } catch (error) {
        console.error('Error loading contacts:', error.message);
    }
})();

// Save contacts to the JSON file
async function saveContacts() {
    try {
        await fs.writeFile(contactsFilePath, JSON.stringify(contacts, null, 2), 'utf-8');
        console.log('Contacts saved to file.');
    } catch (error) {
        console.error('Error saving contacts:', error.message);
    }
}

app.get("/contacts", (req, res) => {
   return res.json({ data: contacts });
});

// search by firstName or lastname
app.get("/contact/search/:param", (req, res) => {
    const searchParam = req.params.param;

    // Find the contact with the specified first name, last name, or phone number
    const contact = contacts.find(contact =>
        contact.firstName === searchParam ||
        contact.lastName === searchParam ||
        contact.phone === searchParam
    );

    if (!contact) {
        return res.status(404).json({ status: 'error', message: 'Contact not found' });
    }

    res.json({ data: contact });
});

// add contacts
app.post("/contact/add", (req, res) => {
    const { firstName, lastName, phone } = req.body;

    const existingContact = contacts.find(contact =>
        contact.firstName === firstName &&
        contact.lastName === lastName ||
        contact.phone === phone
    );

    if (existingContact) {
        return res.status(400).json({ status: 'error', message: 'Contact with the same properties already exists' });
    }

    const id = contacts.length + 1;
    contacts.push({ firstName, lastName, phone, id });

    saveContacts();

    return res.json({ status: 'success', id });
});

// Delete by firstname or lastname
app.delete("/contact/delete/:name", (req, res) => {
    const nameToDelete = req.params.name;

    // Find the index of the contact with the specified first name or last name
    const contactIndex = contacts.findIndex(contact =>
        contact.firstName === nameToDelete || contact.lastName === nameToDelete
    );

    if (contactIndex === -1) {
        return res.status(404).json({ status: 'error', message: 'Contact not found' });
    }

    // Remove the contact from the array
    const deletedContact = contacts.splice(contactIndex, 1)[0];

    saveContacts(); // Save the updated contacts to the file

   return  res.json({ status: 'success', message: 'Contact deleted successfully', deletedContact });
});


app.put("/contact/update/:name", (req, res) => {           // extra gobi work 
    const nameToUpdate = req.params.name;
    const { firstName, lastName, phone } = req.body;

    // Find the index of the contact with the specified first name or last name
    const contactIndex = contacts.findIndex(contact =>
        contact.firstName === nameToUpdate || contact.lastName === nameToUpdate
    );

    if (contactIndex === -1) {
        return res.status(404).json({ status: 'error', message: 'Contact not found' });
    }

    // Check if the updated phone number already exists
    const existingContact = contacts.find(contact => contact.phone === phone && contactIndex !== contact.id);

    if (existingContact) {
        return res.status(400).json({ status: 'error', message: 'Contact with the same phone number already exists' });
    }

    // Update the contact
    contacts[contactIndex] = { ...contacts[contactIndex], firstName, lastName, phone };

    saveContacts(); // Save the updated contacts to the file

    return res.json({ status: 'success', message: 'Contact updated successfully' });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
